from database import SessionLocal, AmbientEvent
db = SessionLocal()
db.query(AmbientEvent).delete()
db.commit()
print("Cleared")
