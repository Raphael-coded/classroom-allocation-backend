# seed.py
from database import SessionLocal
import models

db = SessionLocal()

def seed_data():
    # Clear old data safely for seeding
    db.query(models.Course).delete()
    db.query(models.Lecturer).delete()
    db.query(models.Room).delete()
    db.query(models.Level).delete()
    db.query(models.TimetableSlot).delete()
    db.commit()

    # 1. Add Levels
    l1 = models.Level(name="100L", enrolment=50)
    l2 = models.Level(name="200L", enrolment=60)
    db.add_all([l1, l2])
    db.commit()

    # 2. Add Rooms
    r1 = models.Room(name="Hall A", capacity=100)
    r2 = models.Room(name="Lab 1", capacity=80)
    db.add_all([r1, r2])
    db.commit()

    # 3. Add Lecturers with Multiple Day Preferences
    lec1 = models.Lecturer(
        name="Dr. Abere", 
        max_hours=12, 
        preferred_day="Monday, Wednesday", 
        preferred_slot="08:00 - 10:00"
    )
    lec2 = models.Lecturer(
        name="Dr. Ben Charles", 
        max_hours=12, 
        preferred_day="Tuesday, Thursday", 
        preferred_slot="10:00 - 12:00"
    )
    db.add_all([lec1, lec2])
    db.commit()

    # 4. Add Courses
    c1 = models.Course(code="CSC 121", title="Introduction to Computing", level="100L", lecturer_id=lec1.id)
    c2 = models.Course(code="CSC 123", title="Programming Principles", level="100L", lecturer_id=lec2.id)
    db.add_all([c1, c2])
    db.commit()

    print("Database seeded with multi-day preferences successfully!")

if __name__ == "__main__":
    seed_data()