from sqlalchemy.orm import Session

from . import schemas
from .database import User, Load, Transaction, Company


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = User(email=user.email, name=user.name, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_load(db: Session, load_id: int):
    return db.query(Load).filter(Load.id == load_id).first()


def create_load(db: Session, load: schemas.LoadCreate):
    db_load = Load(status=load.status or "Pre-Loading", rate=load.rate)
    db.add(db_load)
    db.commit()
    db.refresh(db_load)
    return db_load


def update_load_status(db: Session, load_id: int, new_status: str):
    db_load = get_load(db, load_id)
    if not db_load:
        return None
    db_load.status = new_status
    db.commit()
    db.refresh(db_load)
    return db_load


def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_tx = Transaction(
        type=transaction.type,
        amount=transaction.amount,
        user_id=transaction.user_id,
        load_id=transaction.load_id,
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx


def get_company(db: Session, company_id: int):
    return db.query(Company).filter(Company.id == company_id).first()
