
import moment from 'moment';
/**
 * Retrieves all class days for a class type.
 * @param {Array <{countdown: Number|null, date: String, weekday: Number, description: String, note: String, type: String}>} allClassDays - result from getAllClassDays
 * @param {Array <number>} weekdays - which days are class days
 * @param {String} type - CLIC, Comm, G9, H (High school)'.
 * @returns {Array <{countdown: Number|null, date: String, weekday: Number, description: String, note: String, type: String}>}
 */
export const getClassDaysByType = (allClassDays, weekdays, type='', grade='') => {
  //This should NOT happen
  if (type === '' && grade === '') alert('Error: No type and no grade are selected!');
  const classDays = allClassDays.filter(day => weekdays.includes(day.weekday));
  // console.log(JSON.stringify(filteredClassDays))

  let typedClassDays = classDays.map(day => {
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

  // get exam days
  let examDays = allClassDays.filter(day => day.description === 'Exam');

  // add 'Oral Exam days for Comm classes
  if (type!=='CLIL') {
    //find the first exam date for each term
    const firstExamDays = 
    (type === 'H')
    ? [examDays[4]]
    : [examDays[0], examDays[2], examDays[4]];
    
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
  // console.log(examDays[1].date);
  let classCounts = [
    { "term": 1, "classes": 0, "offs": 0 },
    { "term": 2, "classes": 0, "offs": 0 },
    { "term": 3, "classes": 0, "offs": 0 }
  ];

typedClassDays.forEach(day => {
  let thisDay = moment(day.date);
  let termIndex = thisDay.isBefore(moment(examDays[0].date)) ? 0 :  //term 1
                  thisDay.isBetween(moment(examDays[1].date), moment(examDays[2].date)) ? 1 : //term 2
                  thisDay.isBetween(moment(examDays[3].date), moment(examDays[4].date)) ? 2 : undefined; //term 3

  if (termIndex !== undefined) {
    (day.description !== 'Off')? classCounts[termIndex].classes++: classCounts[termIndex].offs++;
  }

});

  typedClassDays.sort((a, b) => moment(b.date).diff(moment(a.date)));

  // Add class count
  let termIndex = 0;
  let countdown = 0; // start at 0

  typedClassDays = typedClassDays.map(day => {
  if (day.description !== 'Off' && day.description !== 'Exam') {
    day.countdown = countdown; // assign first, then increment
    countdown++;
  } else if (day.description === 'Exam' || day.description === 'Off') {
    day.countdown = null; // set countdown to null if the day is an Exam day
  }

  // If we've reached the end of a term, move to the next term
  if (countdown >= classCounts[termIndex].classes && termIndex < classCounts.length - 1) {
    termIndex++;
    countdown = 0; // reset to 0 for the next term
  }

  //one base
  // if (day.countdown || day.countdown === 0) day.countdown++;

  return day;
});

  return typedClassDays;
}