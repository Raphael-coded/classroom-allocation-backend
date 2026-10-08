import axios from 'axios';
import { useEffect, useState } from 'react';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [levels, setLevels] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Diagnostic / Conflict State
  const [conflictData, setConflictData] = useState(null);

  // Form States
  const [lvlName, setLvlName] = useState("");
  const [lvlQuota, setLvlQuota] = useState("");
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [editQuotaValue, setEditQuotaValue] = useState("");

  const [lecName, setLecName] = useState("");
  const [selectedDays, setSelectedDays] = useState(["Any Day"]);
  const [unavailDays, setUnavailDays] = useState([]);
  const [lecPrefSlot, setLecPrefSlot] = useState("Any");

  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [courseLecId, setCourseLecId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCap, setRoomCap] = useState("");

  const availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const lvl = await axios.get(`${API_BASE}/levels`);
      const l = await axios.get(`${API_BASE}/lecturers`);
      const c = await axios.get(`${API_BASE}/courses`);
      const r = await axios.get(`${API_BASE}/rooms`);
      const t = await axios.get(`${API_BASE}/timetable`);
      setLevels(lvl.data);
      setLecturers(l.data);
      setCourses(c.data);
      setRooms(r.data);
      setTimetable(t.data);
    } catch (err) {
      console.error("Error fetching database content", err);
    }
  };

  const handleDayCheckboxChange = (day) => {
    if (day === "Any Day") {
      setSelectedDays(["Any Day"]);
      return;
    }

    let updated = selectedDays.filter(d => d !== "Any Day");
    if (updated.includes(day)) {
      updated = updated.filter(d => d !== day);
    } else {
      updated.push(day);
      setUnavailDays(prev => prev.filter(d => d !== day));
    }

    if (updated.length === 0) {
      updated = ["Any Day"];
    }

    setSelectedDays(updated);
  };

  const handleUnavailDayCheckboxChange = (day) => {
    if (unavailDays.includes(day)) {
      setUnavailDays(unavailDays.filter(d => d !== day));
    } else {
      setUnavailDays([...unavailDays, day]);
      setSelectedDays(prev => prev.filter(d => d !== day));
    }
  };

  const handleAddLevel = async (e) => {
    e.preventDefault();
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      await axios.post(`${API_BASE}/levels`, { name: lvlName, enrolment: parseInt(lvlQuota) });
      setLvlName(""); setLvlQuota("");
      fetchData();
      setMessage("Academic Level added successfully!");
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Error adding level"); }
  };

  const handleUpdateLevelQuota = async (id) => {
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const res = await axios.put(`${API_BASE}/levels/${id}`, { enrolment: parseInt(editQuotaValue) });
      setEditingLevelId(null);
      setEditQuotaValue("");
      fetchData();
      setMessage(res.data.message);
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Error updating level quota"); }
  };

  const handleAddLecturer = async (e) => {
    e.preventDefault();
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const prefDayString = selectedDays.join(", ");
      const unavailDayString = unavailDays.join(", ");
      
      await axios.post(`${API_BASE}/lecturers`, { 
        name: lecName, 
        max_hours: 12,
        preferred_day: prefDayString,
        preferred_slot: lecPrefSlot,
        unavailable_days: unavailDayString
      });
      setLecName(""); setSelectedDays(["Any Day"]); setUnavailDays([]); setLecPrefSlot("Any");
      fetchData();
      setMessage("Lecturer added successfully!");
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Error adding lecturer"); }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      await axios.post(`${API_BASE}/courses`, {
        code: courseCode, title: courseTitle, level: courseLevel, lecturer_id: parseInt(courseLecId)
      });
      setCourseCode(""); setCourseTitle(""); setCourseLevel(""); setCourseLecId("");
      fetchData();
      setMessage("Course added successfully!");
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Error adding course"); }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      await axios.post(`${API_BASE}/rooms`, { name: roomName, capacity: parseInt(roomCap) });
      setRoomName(""); setRoomCap("");
      fetchData();
      setMessage("Room added successfully!");
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Error adding room"); }
  };

  const handleDeleteLevel = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete level ${name}?`)) return;
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const res = await axios.delete(`${API_BASE}/levels/${id}`);
      setMessage(res.data.message);
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Failed to delete level."); }
  };

  const handleDeleteLecturer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const res = await axios.delete(`${API_BASE}/lecturers/${id}`);
      setMessage(res.data.message);
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Failed to delete lecturer."); }
  };

  const handleDeleteRoom = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete room ${name}?`)) return;
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const res = await axios.delete(`${API_BASE}/rooms/${id}`);
      setMessage(res.data.message);
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Failed to delete room."); }
  };

  const handleDeleteCourse = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete course ${code}?`)) return;
    setErrorMessage(""); setMessage(""); setConflictData(null);
    try {
      const res = await axios.delete(`${API_BASE}/courses/${id}`);
      setMessage(res.data.message);
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.detail || "Failed to delete course."); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(""); 
    setErrorMessage("");
    setConflictData(null);

    try {
      const res = await axios.post(`${API_BASE}/timetable/generate`);
      setMessage(res.data.message);
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;

      if (typeof detail === 'object' && detail !== null) {
        // Structured diagnostic error from backend solver
        setConflictData(detail);
      } else {
        // Fallback string error
        setErrorMessage(detail || "Mathematical conflict detected: Insufficient rooms or capacity mismatch.");
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (timetable.length === 0) return;
    window.open(`${API_BASE}/api/timetable/export-pdf`, "_blank");
  };

  const getLecturerName = (id) => {
    const lec = lecturers.find(l => l.id === id);
    return lec ? lec.name : "Unassigned";
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Classroom Allocations</h1>
          <p style={styles.headerSubtitle}>using scheduling algorithms</p>
        </div>
        {timetable.length > 0 && (
          <button onClick={exportToPDF} style={styles.exportPdfBtn}>
            📄 Export Printable PDF
          </button>
        )}
      </header>

      <div style={styles.metricsRow}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Academic Levels</span>
          <span style={styles.metricValue}>{levels.length}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total Courses</span>
          <span style={styles.metricValue}>{courses.length}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Lecturers</span>
          <span style={styles.metricValue}>{lecturers.length}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Lecture Halls</span>
          <span style={styles.metricValue}>{rooms.length}</span>
        </div>
        <div style={styles.metricCardHighlight}>
          <span style={{...styles.metricLabel, color: '#93c5fd'}}>Scheduled Slots</span>
          <span style={{...styles.metricValue, color: '#fff'}}>{timetable.length}</span>
        </div>
      </div>

      {errorMessage && <div style={styles.errorAlert}>⚠️ {errorMessage}</div>}
      {message && <div style={styles.successAlert}>✅ {message}</div>}

      {/* CONFLICT DIAGNOSTICS CARD */}
      {conflictData && (
        <div style={styles.diagnosticCard}>
          <div style={styles.diagnosticHeader}>
            <span style={{fontSize: '20px'}}>🚨</span>
            <h3 style={styles.diagnosticTitle}>
              Solver Failure: {conflictData.type || "Constraint Infeasibility"}
            </h3>
          </div>
          <p style={styles.diagnosticMsg}>{conflictData.message}</p>
          
          {conflictData.details && (
            <div style={styles.diagnosticDetailsBox}>
              <strong>Details / Bottleneck Entities:</strong>
              <ul style={styles.diagnosticList}>
                {Array.isArray(conflictData.details) ? (
                  conflictData.details.map((item, idx) => <li key={idx}>{item}</li>)
                ) : (
                  <li>{conflictData.details}</li>
                )}
              </ul>
            </div>
          )}

          {conflictData.suggested_action && (
            <div style={styles.suggestionBox}>
              💡 <strong>Recommended Fix:</strong> {conflictData.suggested_action}
            </div>
          )}
        </div>
      )}

      <div style={styles.tabsContainer}>
        <button onClick={() => setActiveTab("dashboard")} style={activeTab === "dashboard" ? styles.tabActive : styles.tab}>
          🗓️ Timetable View
        </button>
        <button onClick={() => setActiveTab("manage")} style={activeTab === "manage" ? styles.tabActive : styles.tab}>
          ⚙️ Asset Management
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div>
          <div style={styles.heroBox}>
            <h2 style={{margin: '0 0 10px 0'}}>Schedule Classes Here</h2>
            <p style={{margin: '0 0 20px 0', color: '#475569'}}>
              Click to evaluate level quotas, room capacities, and teacher preferences.
            </p>
            <button onClick={handleGenerate} disabled={loading} style={loading ? styles.btnDisabled : styles.generateBtn}>
              {loading ? "Calculating Variables..." : "Schedule Classes ⚡"}
            </button>
          </div>

          <h2 style={{marginTop: '30px', color: '#1e293b'}}>Generated Department Timetable</h2>
          {timetable.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{fontSize: '18px', color: '#64748b', margin: 0}}>
                No timetable has been generated yet. Add your levels, rooms, and courses in Asset Management first.
              </p>
            </div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Day</th>
                    <th style={styles.th}>Time Block</th>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>Level</th>
                    <th style={styles.th}>Lecturer</th>
                    <th style={styles.th}>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((slot, index) => {
                    const isNewDay = index === 0 || timetable[index - 1].day !== slot.day;
                    return (
                      <tr key={slot.id} style={{
                        ...(index % 2 === 0 ? styles.trEven : styles.trOdd),
                        ...(isNewDay && index !== 0 ? { borderTop: '3px solid #cbd5e1' } : {})
                      }}>
                        <td style={styles.td}><strong>{slot.day}</strong></td>
                        <td style={styles.td}>{slot.time_slot}</td>
                        <td style={{...styles.td, fontWeight: 'bold', color: '#2563eb'}}>{slot.course_code}</td>
                        <td style={styles.td}><span style={styles.levelBadge}>{slot.level}</span></td>
                        <td style={styles.td}>{slot.lecturer_name}</td>
                        <td style={styles.td}><span style={styles.roomBadge}>{slot.room_name}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "manage" && (
        <div style={styles.formsGrid}>
          
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🎓 Academic Levels & Quotas</h3>
            <form onSubmit={handleAddLevel} style={{marginBottom: '20px'}}>
              <label style={styles.label}>Level Name</label>
              <input type="text" placeholder="e.g. 100L" value={lvlName} onChange={e => setLvlName(e.target.value)} required style={styles.input} />
              <label style={styles.label}>Student Quota / Enrolment</label>
              <input type="number" placeholder="e.g. 150" value={lvlQuota} onChange={e => setLvlQuota(e.target.value)} required style={styles.input} />
              <button type="submit" style={styles.submitBtn}>+ Save Level</button>
            </form>

            <h4 style={styles.subTitle}>Active Levels ({levels.length})</h4>
            <div style={styles.listContainer}>
              {levels.length === 0 ? <p style={styles.emptyText}>No levels found.</p> : levels.map(lvl => (
                <div key={lvl.id} style={styles.listItem}>
                  <div>
                    <strong>{lvl.name}</strong> — 
                    {editingLevelId === lvl.id ? (
                      <span style={{marginLeft: '6px'}}>
                        <input 
                          type="number" 
                          style={styles.smallInput} 
                          value={editQuotaValue} 
                          onChange={e => setEditQuotaValue(e.target.value)} 
                        />
                        <button onClick={() => handleUpdateLevelQuota(lvl.id)} style={styles.saveInlineBtn}>Save</button>
                        <button onClick={() => setEditingLevelId(null)} style={styles.cancelInlineBtn}>✕</button>
                      </span>
                    ) : (
                      <span style={{fontSize: '12px', color: '#64748b', marginLeft: '6px'}}>
                        ({lvl.enrolment} students)
                        <button 
                          onClick={() => { setEditingLevelId(lvl.id); setEditQuotaValue(lvl.enrolment); }} 
                          style={styles.editBtn}
                        >
                          ✏️ Edit
                        </button>
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteLevel(lvl.id, lvl.name)} style={styles.deleteBtn}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>👨‍🏫 Lecturers & Preferences</h3>
            <form onSubmit={handleAddLecturer} style={{marginBottom: '20px'}}>
              <label style={styles.label}>Full Name</label>
              <input type="text" placeholder="e.g. Dr. Alao" value={lecName} onChange={e => setLecName(e.target.value)} required style={styles.input} />
              
              <label style={styles.label}>Preferred Days</label>
              <div style={styles.checkboxGroup}>
                <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={selectedDays.includes("Any Day")} 
                    onChange={() => handleDayCheckboxChange("Any Day")} 
                  /> Any Day
                </label>
                {availableDays.map(day => (
                  <label key={day} style={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={selectedDays.includes(day)} 
                      onChange={() => handleDayCheckboxChange(day)} 
                    /> {day}
                  </label>
                ))}
              </div>

              <label style={{...styles.label, color: '#dc2626'}}>🚫 Completely Unavailable Days</label>
              <div style={{...styles.checkboxGroup, backgroundColor: '#fef2f2', borderColor: '#fecaca'}}>
                {availableDays.map(day => (
                  <label key={day} style={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={unavailDays.includes(day)} 
                      onChange={() => handleUnavailDayCheckboxChange(day)} 
                    /> {day}
                  </label>
                ))}
              </div>

              <label style={styles.label}>Preferred Time Slot</label>
              <select value={lecPrefSlot} onChange={e => setLecPrefSlot(e.target.value)} style={styles.input}>
                <option value="Any">Any Time</option>
                <option value="08:00 - 10:00">08:00 - 10:00</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
                <option value="14:00 - 16:00">14:00 - 16:00</option>
              </select>

              <button type="submit" style={styles.submitBtn}>+ Save Lecturer</button>
            </form>
            
            <h4 style={styles.subTitle}>Active Lecturers ({lecturers.length})</h4>
            <div style={styles.listContainer}>
              {lecturers.length === 0 ? <p style={styles.emptyText}>No lecturers found.</p> : lecturers.map(l => (
                <div key={l.id} style={styles.listItem}>
                  <div style={{textAlign: 'left'}}>
                    <strong>{l.name}</strong>
                    <div style={{fontSize: '11px', color: '#64748b', marginTop: '2px'}}>
                      Pref: {l.preferred_day || 'Any Day'} | {l.preferred_slot || 'Any'}
                    </div>
                    {l.unavailable_days && (
                      <div style={{fontSize: '11px', color: '#dc2626', fontWeight: 'bold', marginTop: '2px'}}>
                        Off: {l.unavailable_days}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteLecturer(l.id, l.name)} style={styles.deleteBtn}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🏫 Halls & Rooms</h3>
            <form onSubmit={handleAddRoom} style={{marginBottom: '20px'}}>
              <label style={styles.label}>Room Name</label>
              <input type="text" placeholder="e.g. Lab 102" value={roomName} onChange={e => setRoomName(e.target.value)} required style={styles.input} />
              <label style={styles.label}>Seating Capacity</label>
              <input type="number" placeholder="e.g. 120" value={roomCap} onChange={e => setRoomCap(e.target.value)} required style={styles.input} />
              <button type="submit" style={styles.submitBtn}>+ Save Room</button>
            </form>

            <h4 style={styles.subTitle}>Active Rooms ({rooms.length})</h4>
            <div style={styles.listContainer}>
              {rooms.length === 0 ? <p style={styles.emptyText}>No rooms found.</p> : rooms.map(r => (
                <div key={r.id} style={styles.listItem}>
                  <div style={{textAlign: 'left'}}><strong>{r.name}</strong> <span style={{fontSize: '12px', color: '#64748b'}}>({r.capacity} seats)</span></div>
                  <button onClick={() => handleDeleteRoom(r.id, r.name)} style={styles.deleteBtn}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.cardFull}>
            <h3 style={styles.cardTitle}>📚 Registered Courses</h3>
            <form onSubmit={handleAddCourse} style={{marginBottom: '20px'}}>
              <div style={{display: 'flex', gap: '15px'}}>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Course Code</label>
                  <input type="text" placeholder="e.g. CSC301" value={courseCode} onChange={e => setCourseCode(e.target.value)} required style={styles.input} />
                </div>
                <div style={{flex: 1}}>
                  <label style={styles.label}>Academic Level</label>
                  <select value={courseLevel} onChange={e => setCourseLevel(e.target.value)} required style={styles.input}>
                    <option value="">-- Select Level --</option>
                    {levels.map(lvl => <option key={lvl.id} value={lvl.name}>{lvl.name} ({lvl.enrolment} students)</option>)}
                  </select>
                </div>
              </div>
              <label style={styles.label}>Course Title</label>
              <input type="text" placeholder="e.g. Systems Programming" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required style={styles.input} />
              <label style={styles.label}>Assigned Lecturer</label>
              <select value={courseLecId} onChange={e => setCourseLecId(e.target.value)} required style={styles.input}>
                <option value="">-- Select Lecturer --</option>
                {lecturers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <button type="submit" style={styles.submitBtn}>+ Save Course Record</button>
            </form>

            <h4 style={styles.subTitle}>Active Courses ({courses.length})</h4>
            <div style={styles.listContainer}>
              {courses.length === 0 ? <p style={styles.emptyText}>No courses registered.</p> : courses.map(c => (
                <div key={c.id} style={styles.listItem}>
                  <div style={{textAlign: 'left'}}>
                    <strong style={{color: '#2563eb'}}>{c.code}</strong> — {c.title} <span style={styles.levelBadge}>{c.level}</span>
                    <span style={{fontSize: '12px', color: '#64748b', marginLeft: '10px'}}>Assigned to: {getLecturerName(c.lecturer_id)}</span>
                  </div>
                  <button onClick={() => handleDeleteCourse(c.id, c.code)} style={styles.deleteBtn}>🗑️ Delete</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", padding: '30px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#334155' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' },
  headerTitle: { margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '800' },
  headerSubtitle: { margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' },
  exportPdfBtn: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '25px' },
  metricCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  metricCardHighlight: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  metricLabel: { fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' },
  errorAlert: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' },
  successAlert: { backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' },
  
  // Diagnostic Card Styles
  diagnosticCard: { backgroundColor: '#fef2f2', border: '2px solid #ef4444', padding: '20px', borderRadius: '12px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)' },
  diagnosticHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  diagnosticTitle: { margin: 0, color: '#991b1b', fontSize: '18px', fontWeight: '700' },
  diagnosticMsg: { margin: '0 0 12px 0', color: '#7f1d1d', fontSize: '14px' },
  diagnosticDetailsBox: { backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', marginBottom: '12px', fontSize: '13px', color: '#450a0a' },
  diagnosticList: { margin: '6px 0 0 0', paddingLeft: '20px' },
  suggestionBox: { backgroundColor: '#fef3c7', border: '1px solid #fcd34d', color: '#78350f', padding: '12px', borderRadius: '8px', fontSize: '13px' },

  tabsContainer: { display: 'flex', gap: '10px', marginBottom: '25px' },
  tab: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  tabActive: { padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' },
  heroBox: { backgroundColor: '#fff', padding: '28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  generateBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' },
  btnDisabled: { backgroundColor: '#94a3b8', color: '#fff', border: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '700', borderRadius: '8px', cursor: 'not-allowed' },
  emptyState: { backgroundColor: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '2px dashed #cbd5e1', marginTop: '15px' },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { backgroundColor: '#f1f5f9' },
  th: { padding: '14px 18px', fontSize: '13px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' },
  td: { padding: '14px 18px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' },
  trEven: { backgroundColor: '#fff' },
  trOdd: { backgroundColor: '#f8fafc' },
  levelBadge: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
  roomBadge: { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
  formsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardFull: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: '1 / -1' },
  cardTitle: { margin: '0 0 15px 0', fontSize: '18px', color: '#0f172a' },
  subTitle: { margin: '15px 0 10px 0', fontSize: '14px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  checkboxGroup: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' },
  checkboxLabel: { fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '14px', boxSizing: 'border-box' },
  smallInput: { width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' },
  submitBtn: { width: '100%', backgroundColor: '#0f172a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  saveInlineBtn: { backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', marginLeft: '4px', cursor: 'pointer', fontSize: '12px' },
  cancelInlineBtn: { backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', marginLeft: '2px', cursor: 'pointer', fontSize: '12px' },
  editBtn: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', marginLeft: '6px' },
  listContainer: { maxHeight: '200px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '8px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
  emptyText: { color: '#94a3b8', fontSize: '13px', margin: '5px 0', textAlign: 'center' },
  deleteBtn: { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }
};

export default App;