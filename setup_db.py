from database import engine, Base, SessionLocal
import models

# 1. Create the physical tables in the database file
print("Creating database tables...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# 2. Check if data already exists to prevent duplication
if db.query(models.Lecturer).first() is None:
    print("Populating database with starter department data...")

    # Seed Lecturers
    dr_alao = models.Lecturer(name="Dr. Alao", max_hours=12)
    prof_okon = models.Lecturer(name="Prof. Okon", max_hours=12)
    mrs_eze = models.Lecturer(name="Mrs. Eze", max_hours=12)
    db.add_all([dr_alao, prof_okon, mrs_eze])
    db.commit()

    # Seed Rooms
    room_a = models.Room(name="Lecture Hall 1", capacity=100)
    room_b = models.Room(name="Compu-Lab A", capacity=40)
    db.add_all([room_a, room_b])
    db.commit()

    # Seed Courses (Linked to Lecturer IDs)
    db.add_all([
        models.Course(code="CSC101", title="Introduction to Computer Science", level="100L", lecturer_id=dr_alao.id),
        models.Course(code="MTH101", title="General Mathematics I", level="100L", lecturer_id=prof_okon.id),
        models.Course(code="CSC201", title="Java Programming", level="200L", lecturer_id=dr_alao.id),
        models.Course(code="CSC203", title="Digital Logic Design", level="200L", lecturer_id=mrs_eze.id)
    ])
    db.commit()
    print("Database initialization complete! 'timetable.db' created successfully.")
else:
    print("Database already initialized and contains data.")

db.close()