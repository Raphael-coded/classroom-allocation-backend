from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from ortools.sat.python import cp_model
import pydantic

import models
from database import engine, get_db
from services.pdf_generator import generate_pdf_timetable

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="University Timetable Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PYDANTIC SCHEMAS ---
class LevelCreate(pydantic.BaseModel):
    name: str
    enrolment: int

class LevelUpdate(pydantic.BaseModel):
    enrolment: int

class LecturerCreate(pydantic.BaseModel):
    name: str
    max_hours: int = 12
    preferred_day: str = "Any Day"
    preferred_slot: str = "Any"
    unavailable_days: str = ""

class CourseCreate(pydantic.BaseModel):
    code: str
    title: str
    level: str
    lecturer_id: int

class RoomCreate(pydantic.BaseModel):
    name: str
    capacity: int

# --- API ENDPOINTS ---

@app.get("/")
def root():
    return {"status": "API is operational and running smoothly"}

# --- LEVEL ENDPOINTS ---
@app.get("/levels")
def get_levels(db: Session = Depends(get_db)):
    return db.query(models.Level).all()

@app.post("/levels")
def create_level(lvl: LevelCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Level).filter(models.Level.name == lvl.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Level name already exists")
    new_lvl = models.Level(name=lvl.name, enrolment=lvl.enrolment)
    db.add(new_lvl)
    db.commit()
    db.refresh(new_lvl)
    return new_lvl

@app.put("/levels/{level_id}")
def update_level_quota(level_id: int, lvl_update: LevelUpdate, db: Session = Depends(get_db)):
    lvl = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not lvl:
        raise HTTPException(status_code=404, detail="Level not found.")
    
    lvl.enrolment = lvl_update.enrolment
    db.commit()
    db.refresh(lvl)
    return {"message": f"Updated {lvl.name} quota to {lvl.enrolment} students.", "level": lvl}

@app.delete("/levels/{level_id}")
def delete_level(level_id: int, db: Session = Depends(get_db)):
    lvl = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not lvl:
        raise HTTPException(status_code=404, detail="Level not found.")
    
    assigned_courses = db.query(models.Course).filter(models.Course.level == lvl.name).all()
    if assigned_courses:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete level '{lvl.name}' because courses are assigned to it."
        )

    db.delete(lvl)
    db.commit()
    return {"message": f"Level '{lvl.name}' deleted successfully."}

# --- LECTURER ENDPOINTS ---
@app.get("/lecturers")
def get_lecturers(db: Session = Depends(get_db)):
    return db.query(models.Lecturer).all()

@app.post("/lecturers")
def create_lecturer(lecturer: LecturerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Lecturer).filter(models.Lecturer.name == lecturer.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Lecturer name already exists")
    
    new_lec = models.Lecturer(
        name=lecturer.name, 
        max_hours=lecturer.max_hours,
        preferred_day=lecturer.preferred_day,
        preferred_slot=lecturer.preferred_slot,
        unavailable_days=lecturer.unavailable_days
    )
    db.add(new_lec)
    db.commit()
    db.refresh(new_lec)
    return new_lec

@app.delete("/lecturers/{lecturer_id}")
def delete_lecturer(lecturer_id: int, db: Session = Depends(get_db)):
    lecturer = db.query(models.Lecturer).filter(models.Lecturer.id == lecturer_id).first()
    if not lecturer:
        raise HTTPException(status_code=404, detail="Lecturer not found.")
    
    assigned_courses = db.query(models.Course).filter(models.Course.lecturer_id == lecturer_id).all()
    if assigned_courses:
        course_codes = ", ".join([c.code for c in assigned_courses])
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete lecturer. Reassign or delete these assigned courses first: {course_codes}"
        )

    db.delete(lecturer)
    db.commit()
    return {"message": f"Lecturer '{lecturer.name}' deleted successfully."}

# --- COURSE ENDPOINTS ---
@app.get("/courses")
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@app.post("/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Course).filter(models.Course.code == course.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    
    lec = db.query(models.Lecturer).filter(models.Lecturer.id == course.lecturer_id).first()
    if not lec:
        raise HTTPException(status_code=404, detail="Lecturer ID not found")

    new_course = models.Course(
        code=course.code, title=course.title, level=course.level, lecturer_id=course.lecturer_id
    )
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@app.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found.")

    db.delete(course)
    db.commit()
    return {"message": f"Course '{course.code}' deleted successfully."}

# --- ROOM ENDPOINTS ---
@app.get("/rooms")
def get_rooms(db: Session = Depends(get_db)):
    return db.query(models.Room).all()

@app.post("/rooms")
def create_room(room: RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Room).filter(models.Room.name == room.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room name already exists")
        
    new_room = models.Room(name=room.name, capacity=room.capacity)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.delete("/rooms/{room_id}")
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found.")

    db.delete(room)
    db.commit()
    return {"message": f"Room '{room.name}' deleted successfully."}

# --- TIMETABLE GENERATION ENGINE ---
@app.get("/timetable")
def get_timetable(db: Session = Depends(get_db)):
    slots = db.query(models.TimetableSlot).all()
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5}
    sorted_slots = sorted(slots, key=lambda x: (day_order.get(x.day, 99), x.time_slot))
    return sorted_slots

@app.post("/timetable/generate")
def generate_timetable_endpoint(db: Session = Depends(get_db)):
    db_lecturers = db.query(models.Lecturer).all()
    db_courses = db.query(models.Course).all()
    db_rooms = db.query(models.Room).all()
    db_levels = db.query(models.Level).all()

    if not db_courses or not db_rooms or not db_levels:
        raise HTTPException(
            status_code=400, 
            detail="Cannot generate timetable without registered levels, rooms, and courses."
        )

    level_quota_map = {lvl.name: lvl.enrolment for lvl in db_levels}
    lec_pref_map = {
        l.id: {
            "pref_day": l.preferred_day, 
            "pref_slot": l.preferred_slot, 
            "unavailable_days": l.unavailable_days or "",
            "name": l.name
        } for l in db_lecturers
    }

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    time_slots = ["08:00 - 10:00", "10:00 - 12:00", "12:00 - 14:00", "14:00 - 16:00"]

    courses_dict = {}
    for c in db_courses:
        lec_info = lec_pref_map.get(c.lecturer_id, {"name": "Unknown", "pref_day": "Any Day", "pref_slot": "Any", "unavailable_days": ""})
        enrolment = level_quota_map.get(c.level, 0)
        courses_dict[c.code] = {
            "lecturer_id": c.lecturer_id,
            "lecturer": lec_info["name"], 
            "level": c.level, 
            "enrolment": enrolment,
            "pref_day": lec_info["pref_day"],
            "pref_slot": lec_info["pref_slot"],
            "unavailable_days": lec_info["unavailable_days"]
        }

    model = cp_model.CpModel()
    timetable_vars = {}

    for c_code in courses_dict:
        for rm in db_rooms:
            for day in days:
                for slot in time_slots:
                    timetable_vars[(c_code, rm.name, day, slot)] = model.NewBoolVar(
                        f"slot_{c_code}_{rm.name}_{day}_{slot}"
                    )

    # Constraint 1: Course scheduled exactly ONCE
    for c_code in courses_dict:
        model.Add(
            sum(timetable_vars[(c_code, rm.name, day, slot)] for rm in db_rooms for day in days for slot in time_slots) == 1
        )

    # Constraint 2: Room Non-Overlap
    for rm in db_rooms:
        for day in days:
            for slot in time_slots:
                model.Add(sum(timetable_vars[(c_code, rm.name, day, slot)] for c_code in courses_dict) <= 1)

    # Constraint 3: Lecturer Non-Overlap
    lecturer_ids = set(info["lecturer_id"] for info in courses_dict.values())
    for l_id in lecturer_ids:
        lec_courses = [c_code for c_code, info in courses_dict.items() if info["lecturer_id"] == l_id]
        for day in days:
            for slot in time_slots:
                model.Add(sum(timetable_vars[(c_code, rm.name, day, slot)] for c_code in lec_courses for rm in db_rooms) <= 1)

    # Constraint 4: Student Level Non-Overlap
    levels_set = set(info["level"] for info in courses_dict.values())
    for lvl in levels_set:
        lvl_courses = [c_code for c_code, info in courses_dict.items() if info["level"] == lvl]
        for day in days:
            for slot in time_slots:
                model.Add(sum(timetable_vars[(c_code, rm.name, day, slot)] for c_code in lvl_courses for rm in db_rooms) <= 1)

    # Constraint 5: Level Daily Workload Cap (Max 2 classes per day per level)
    for lvl in levels_set:
        lvl_courses = [c_code for c_code, info in courses_dict.items() if info["level"] == lvl]
        for day in days:
            model.Add(
                sum(
                    timetable_vars[(c_code, rm.name, day, slot)] 
                    for c_code in lvl_courses 
                    for rm in db_rooms 
                    for slot in time_slots
                ) <= 2
            )

    # Constraint 6: Room Capacity vs. Level Quota
    for c_code, info in courses_dict.items():
        quota = info["enrolment"]
        for rm in db_rooms:
            if rm.capacity < quota:
                for day in days:
                    for slot in time_slots:
                        model.Add(timetable_vars[(c_code, rm.name, day, slot)] == 0)

    # Constraint 7 (HARD): Lecturer Completely Unavailable Days
    for c_code, info in courses_dict.items():
        unavail_str = info.get("unavailable_days", "")
        if unavail_str:
            unavail_list = [d.strip() for d in unavail_str.split(",") if d.strip()]
            for day in unavail_list:
                if day in days:
                    for rm in db_rooms:
                        for slot in time_slots:
                            model.Add(timetable_vars[(c_code, rm.name, day, slot)] == 0)

    # --- LECTURER PREFERENCE PENALTIES ---
    penalty_terms = []
    
    for c_code, info in courses_dict.items():
        p_day_raw = info["pref_day"] or "Any Day"
        p_slot = info["pref_slot"]

        preferred_days_list = [d.strip() for d in p_day_raw.split(",") if d.strip()]

        for rm in db_rooms:
            for day in days:
                for slot in time_slots:
                    var = timetable_vars[(c_code, rm.name, day, slot)]
                    
                    if "Any Day" not in preferred_days_list and day not in preferred_days_list:
                        penalty_terms.append(var * 10)
                    
                    if p_slot and p_slot != "Any" and slot != p_slot:
                        penalty_terms.append(var * 5)

    if penalty_terms:
        model.Minimize(sum(penalty_terms))

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        db.query(models.TimetableSlot).delete()
        db.commit()

        new_slots = []
        for (c_code, rm_name, day, slot), var in timetable_vars.items():
            if solver.Value(var) == 1:
                new_slots.append(
                    models.TimetableSlot(
                        day=day,
                        time_slot=slot,
                        course_code=c_code,
                        lecturer_name=courses_dict[c_code]["lecturer"],
                        room_name=rm_name,
                        level=courses_dict[c_code]["level"]
                    )
                )
        db.add_all(new_slots)
        db.commit()
        return {"status": "Success", "message": f"Successfully calculated and saved {len(new_slots)} conflict-free timetable classes."}
    else:
        raise HTTPException(
            status_code=400, 
            detail="Infeasible Schedule: Room capacities are too small, lecturer unavailability restricts slots too tightly, or time slot conflicts cannot be resolved."
        )

@app.get("/api/timetable/export-pdf")
def export_timetable_pdf(
    level: Optional[str] = Query(None),
    lecturer_name: Optional[str] = Query(None),
    room_name: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.TimetableSlot)
    
    title = "Department Lecture Schedule"
    if level:
        query = query.filter(models.TimetableSlot.level == level)
        title = f"Timetable - Level {level}"
    elif lecturer_name:
        query = query.filter(models.TimetableSlot.lecturer_name == lecturer_name)
        title = f"Timetable - {lecturer_name}"
    elif room_name:
        query = query.filter(models.TimetableSlot.room_name == room_name)
        title = f"Schedule - {room_name}"

    slots = query.all()
    
    if not slots:
        raise HTTPException(status_code=404, detail="No schedule data found for PDF generation.")

    data = [
        {
            "day": s.day,
            "time_slot": s.time_slot,
            "course_code": s.course_code,
            "room_name": s.room_name,
            "lecturer_name": s.lecturer_name
        }
        for s in slots
    ]

    pdf_bytes = generate_pdf_timetable(data, title=title)
    filename = f"{title.lower().replace(' ', '_').replace('-', '_')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )