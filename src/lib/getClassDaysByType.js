
import moment from 'moment';
/**
 * Retrieves all class days for a class type.
 * @param {Array <{date: String, weekday: Number, description: String, note: String, type: String}>} classDays
 * @param {Array <number>} weekdays - which days are class days
 * @param {String} type - CLIC, Comm, G9, H (High school)'.
 */
export const getClassDaysByType = (classDays, weekdays, type='', grade='') => {
  //This should NOT happen
  if (type==='' && grade==='') alert('Error: No type and no grade are selected!');
  const newClassDays = classDays.filter(day => weekdays.includes(day.weekday));
  // console.log(JSON.stringify(filteredClassDays))

  let typedClassDays = newClassDays.map(day => {
    if ((type === 'CLIL' && day.type === 'Comm') || //mismatch junior type disgards the other type events
        (type === 'Comm' || type === 'G9') && day.type === 'CLIL' || //G7/8 Comm or G9 disgards CLIL events
        (type === 'Comm' && day.type === 'G9') ||//G7/8 Comm classes disgards G9 events
        (type === 'H') && (day.type === 'CLIL' || day.type === 'Comm')) //H class disgards Junior events
    {
      day.description = '';
      day.note = '';
    }
    return day;
  });
  
  // add 'Oral Exam days for Comm classes
  if (type!=='CLIL') {
    // get exam days
    let examDays = classDays.filter(day => day.description === 'Exam');
    //find the first exam date for each term
    let firstExamDays = [examDays[0], examDays[2], examDays[4]];
    if (type ==='H') firstExamDays = [examDays[4]];
    //sort in descending order so it would find the nearest none-off days prior to the exam date
    typedClassDays.sort((a, b) => moment(b.date).diff(moment(a.date)));
    if (type !=='H') firstExamDays.sort((a, b) => moment(b.date).diff(moment(a.date)));
    //optimize the search for the two class days before the next exam by allowing the loop to start from where it left off in the previous iteration
    let startIndex = 0;
    //loop through the first exam date
    firstExamDays.forEach(theDay => {
      // if (grade === 'G7') console.log('theDay: ' + JSON.stringify(theDay));
      let examDate = moment(theDay.date);
      let daysMatched = 0;
      //compare first eaxm date with all comm class days
      for (let index = startIndex; index < typedClassDays.length; index++) {
        let commClassDay = typedClassDays[index];
        let allClassDay = moment(commClassDay.date);
        // collect the date if it's earlier than the exam day and it's not an off day
        if (allClassDay.isBefore(examDate) && commClassDay.description !== 'Off') {
          // mark matching day as 'Oral Exam'
          typedClassDays[index].description = 'Oral Exam';
          daysMatched++;
          // console.log(commClassDays[index].date)
        }

        // if two days are marked
        if (daysMatched >= 2) {
          // set starting point for the next iteration
          startIndex += index;
          // breakout of the loop to prevent further matching
          break;
        }
      }

    });
  }
  // if (grade ==='H10' || grade ==='H11') console.log (commClassDays)
  typedClassDays.sort((a, b) => moment(b.date).diff(moment(a.date)));
  return typedClassDays;
}