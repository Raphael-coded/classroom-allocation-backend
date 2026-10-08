from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Level(Base):
    __tablename__ = "levels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    enrolment = Column(Integer, nullable=False)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)

class Lecturer(Base):
    __tablename__ = "lecturers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    max_hours = Column(Integer, default=12)
    preferred_day = Column(String, nullable=True)   # e.g., "Monday" or "Any"
    preferred_slot = Column(String, nullable=True)  # e.g., "08:00 - 10:00" or "Any"
    unavailable_days = Column(String, nullable=True, default="") # e.g., "Tuesday, Thursday"

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    level = Column(String, ForeignKey("levels.name"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("lecturers.id"), nullable=False)

class TimetableSlot(Base):
    __tablename__ = "timetable_slots"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    course_code = Column(String, nullable=False)
    lecturer_name = Column(String, nullable=False)
    room_name = Column(String, nullable=False)
    level = Column(String, nullable=False)