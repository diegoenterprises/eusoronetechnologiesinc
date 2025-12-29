from pydantic import BaseModel
from typing import Optional


class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    role: str


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int

    class Config:
        orm_mode = True


class LoadBase(BaseModel):
    status: Optional[str] = "Pre-Loading"
    rate: float = 0.0


class LoadCreate(LoadBase):
    pass


class Load(LoadBase):
    id: int

    class Config:
        orm_mode = True


class LoadUpdateStatus(BaseModel):
    new_status: str


class TransactionBase(BaseModel):
    type: str
    amount: float
    user_id: int
    load_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class Transaction(TransactionBase):
    id: int

    class Config:
        orm_mode = True
