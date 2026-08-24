
async function main() {
  console.log("Fetching teachers and schedules...");
  const [teachers, schedules] = await Promise.all([
    fetch('https://akademikmqbaisykarima.pages.dev/api/teachers').then(r => r.json()),
    fetch('https://akademikmqbaisykarima.pages.dev/api/schedules').then(r => r.json())
  ]);

  console.log(`Found ${teachers.length} teachers and ${schedules.length} schedules.`);

  for (const teacher of teachers) {
    const teacherSchedules = schedules.filter(s => s.teacherId === teacher.id);
    const subjects = [...new Set(teacherSchedules.map(s => s.subjectId))].filter(Boolean);
    const classes = [...new Set(teacherSchedules.map(s => s.classId))].filter(Boolean);

    if (subjects.length > 0 || classes.length > 0) {
      console.log(`Updating ${teacher.name} (${teacher.id}) - Subjects: ${subjects.length}, Classes: ${classes.length}`);
      
      const payload = {
        subjects: JSON.stringify(subjects),
        classes: JSON.stringify(classes)
      };

      const res = await fetch(`https://akademikmqbaisykarima.pages.dev/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        console.error(`Failed to update ${teacher.id}:`, await res.text());
      }
    } else {
      // Clear them if they have no schedules
      const payload = {
        subjects: JSON.stringify([]),
        classes: JSON.stringify([])
      };
      await fetch(`https://akademikmqbaisykarima.pages.dev/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  }

  console.log("Done syncing teacher mappings!");
}

main().catch(console.error);
