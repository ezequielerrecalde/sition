from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import os
import bcrypt
import jwt
import logging
from pathlib import Path
from dotenv import load_dotenv
import uvicorn

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = "notion_clone_secret_key_2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# FastAPI app
app = FastAPI(title="Notion Clone API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class User(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: str
    name: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    workspaces: List[str] = []

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserCreate(BaseModel):
    email: str
    name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime
    workspaces: List[str]

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Workspace(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    owner_id: str
    members: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WorkspaceCreate(BaseModel):
    name: str

class Page(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str
    content: str = ""
    type: str = "page"  # page, database
    icon: str = "FileText"
    workspace_id: str
    parent_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    data: Optional[Dict[str, Any]] = {}
    is_favorite: bool = False

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PageCreate(BaseModel):
    title: str
    content: str = ""
    type: str = "page"
    icon: str = "FileText"
    workspace_id: str
    parent_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = {}

class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    icon: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    is_favorite: Optional[bool] = None

class DatabaseRecord(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    database_id: str
    data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DatabaseRecordCreate(BaseModel):
    data: Dict[str, Any]

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = hash_password(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash
    )
    
    result = await db.users.insert_one(user.dict(by_alias=True, exclude={"id"}))
    user.id = result.inserted_id
    
    # Create default workspace
    workspace = Workspace(
        name=f"{user_data.name}'s Workspace",
        owner_id=str(user.id)
    )
    workspace_result = await db.workspaces.insert_one(workspace.dict(by_alias=True, exclude={"id"}))
    
    # Update user with workspace
    await db.users.update_one(
        {"_id": user.id},
        {"$push": {"workspaces": str(workspace_result.inserted_id)}}
    )
    
    # Create initial pages
    await create_initial_pages(str(workspace_result.inserted_id), str(user.id))
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    user_response = UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        created_at=user.created_at,
        workspaces=[str(workspace_result.inserted_id)]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    user_response = UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"],
        workspaces=user.get("workspaces", [])
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

# Workspace Routes
@api_router.get("/workspaces", response_model=List[Workspace])
async def get_workspaces(current_user: dict = Depends(get_current_user)):
    workspaces = await db.workspaces.find({
        "$or": [
            {"owner_id": str(current_user["_id"])},
            {"members": str(current_user["_id"])}
        ]
    }).to_list(100)
    
    return [Workspace(**workspace) for workspace in workspaces]

@api_router.post("/workspaces", response_model=Workspace)
async def create_workspace(workspace_data: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    workspace = Workspace(
        name=workspace_data.name,
        owner_id=str(current_user["_id"])
    )
    
    result = await db.workspaces.insert_one(workspace.dict(by_alias=True, exclude={"id"}))
    workspace.id = result.inserted_id
    
    # Add to user's workspaces
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$push": {"workspaces": str(workspace.id)}}
    )
    
    return workspace

# Page Routes
@api_router.get("/workspaces/{workspace_id}/pages", response_model=List[Page])
async def get_pages(workspace_id: str, current_user: dict = Depends(get_current_user)):
    pages = await db.pages.find({
        "workspace_id": workspace_id,
        "parent_id": None
    }).to_list(100)
    
    return [Page(**page) for page in pages]

@api_router.post("/workspaces/{workspace_id}/pages", response_model=Page)
async def create_page(workspace_id: str, page_data: PageCreate, current_user: dict = Depends(get_current_user)):
    page = Page(
        title=page_data.title,
        content=page_data.content,
        type=page_data.type,
        icon=page_data.icon,
        workspace_id=workspace_id,
        parent_id=page_data.parent_id,
        created_by=str(current_user["_id"]),
        data=page_data.data or {}
    )
    
    result = await db.pages.insert_one(page.dict(by_alias=True, exclude={"id"}))
    page.id = result.inserted_id
    
    return page

@api_router.get("/pages/{page_id}", response_model=Page)
async def get_page(page_id: str, current_user: dict = Depends(get_current_user)):
    page = await db.pages.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return Page(**page)

@api_router.put("/pages/{page_id}", response_model=Page)
async def update_page(page_id: str, page_data: PageUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in page_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.pages.update_one(
        {"_id": ObjectId(page_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    updated_page = await db.pages.find_one({"_id": ObjectId(page_id)})
    return Page(**updated_page)

@api_router.delete("/pages/{page_id}")
async def delete_page(page_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.pages.delete_one({"_id": ObjectId(page_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {"message": "Page deleted successfully"}

# Database Records Routes
@api_router.get("/pages/{database_id}/records", response_model=List[DatabaseRecord])
async def get_database_records(database_id: str, current_user: dict = Depends(get_current_user)):
    records = await db.database_records.find({"database_id": database_id}).to_list(100)
    return [DatabaseRecord(**record) for record in records]

@api_router.post("/pages/{database_id}/records", response_model=DatabaseRecord)
async def create_database_record(database_id: str, record_data: DatabaseRecordCreate, current_user: dict = Depends(get_current_user)):
    record = DatabaseRecord(
        database_id=database_id,
        data=record_data.data
    )
    
    result = await db.database_records.insert_one(record.dict(by_alias=True, exclude={"id"}))
    record.id = result.inserted_id
    
    return record

@api_router.put("/records/{record_id}", response_model=DatabaseRecord)
async def update_database_record(record_id: str, record_data: DatabaseRecordCreate, current_user: dict = Depends(get_current_user)):
    update_data = record_data.data
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.database_records.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {"data": update_data, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    
    updated_record = await db.database_records.find_one({"_id": ObjectId(record_id)})
    return DatabaseRecord(**updated_record)

@api_router.delete("/records/{record_id}")
async def delete_database_record(record_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.database_records.delete_one({"_id": ObjectId(record_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return {"message": "Record deleted successfully"}

# Utility function to create initial pages
async def create_initial_pages(workspace_id: str, user_id: str):
    initial_pages = [
        {
            "title": "Página de inicio",
            "content": "# Bienvenido a tu workspace\n\nEsta es tu página principal. Puedes empezar escribiendo aquí o crear nuevas páginas en la barra lateral.",
            "type": "page",
            "icon": "Home",
            "workspace_id": workspace_id,
            "created_by": user_id,
            "is_favorite": True
        },
        {
            "title": "Tareas personales",
            "content": "",
            "type": "database",
            "icon": "CheckSquare",
            "workspace_id": workspace_id,
            "created_by": user_id,
            "data": {
                "fields": [
                    {"name": "Título", "type": "title"},
                    {"name": "Estado", "type": "select", "options": ["Pendiente", "En progreso", "Completado"]},
                    {"name": "Prioridad", "type": "select", "options": ["Alta", "Media", "Baja"]},
                    {"name": "Fecha", "type": "date"}
                ]
            }
        }
    ]
    
    for page_data in initial_pages:
        await db.pages.insert_one(page_data)

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Notion Clone API is running"}

# Include router
app.include_router(api_router)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():    client.close()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
