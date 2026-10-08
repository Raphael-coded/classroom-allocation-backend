from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
import io

TIMESLOTS = [
    "08:00 - 10:00",
    "10:00 - 12:00",
    "12:00 - 14:00",
    "14:00 - 16:00"
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

def generate_pdf_timetable(schedules, title="Department Lecture Schedule"):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e293b"),
        alignment=1, # Center
        spaceAfter=15
    )
    
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        alignment=1
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.white,
        alignment=1
    )

    elements = []
    elements.append(Paragraph(title, title_style))

    # Map schedule data into grid matrix: grid[day][timeslot]
    grid = {day: {ts: [] for ts in TIMESLOTS} for day in DAYS}
    
    for item in schedules:
        day = item.get("day")
        ts = item.get("time_slot")
        if day in DAYS and ts in TIMESLOTS:
            course = item.get("course_code", "N/A")
            room = item.get("room_name", "N/A")
            lecturer = item.get("lecturer_name", "")
            
            label = f"<b>{course}</b><br/>{room}"
            if lecturer:
                label += f"<br/><i>{lecturer}</i>"
            grid[day][ts].append(label)

    # Build PDF Table Header (Day | 08:00-10:00 | 10:00-12:00 | ...)
    table_data = [
        [Paragraph("<b>Day / Time</b>", header_style)] + 
        [Paragraph(f"<b>{ts}</b>", header_style) for ts in TIMESLOTS]
    ]

    # Build PDF Table Rows (Days as rows down column 1)
    for day in DAYS:
        row = [Paragraph(f"<b>{day}</b>", cell_style)]
        for ts in TIMESLOTS:
            cell_items = grid[day][ts]
            if cell_items:
                cell_content = "<br/><br/>".join(cell_items)
            else:
                cell_content = "-"
            row.append(Paragraph(cell_content, cell_style))
        table_data.append(row)

    # Styling Table
    # Landscape A4 width is ~842 pt. Subtract margins (40pt) -> 802pt printable.
    # Day column: 102pt, 4 Timeslot columns: 175pt each
    col_widths = [102] + [175] * 4  

    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")), # Dark Header
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    elements.append(t)
    doc.build(elements)
    
    buffer.seek(0)
    return buffer.getvalue()