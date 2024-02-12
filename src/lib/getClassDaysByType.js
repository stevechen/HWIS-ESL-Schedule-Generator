
import moment from 'moment';
/**
 * Retrieves all class days for a class type. Need input from getAllClassDays() that contains class days mixed with event days.
 * - filters out event descriptions and notes if type is mismatched
 * - add oral exam days for all execpt CLIL (rules are different for g7/8, g9, H10/11)
 * - add class countdown column
 * @param {Array <{countdown: Number|null, date: String, weekday: Number, description: String, note: String, type: String}>} allClassDays - result from getAllClassDays
 * @param {Array <number>} weekdays - which days are class days
 * @param {String} type - CLIC, Comm, G9, H (High school)'.
 * @returns {Array <{countdown: Number|null, date: String, weekday: Number, description: String, note: String, type: String}>}
 */
export const getClassDaysByType = (allClassDays, weekdays, type='', grade='') => {
  //This should NOT happen
  if (type === '' && grade === '') alert('Error: No type and no grade are selected!');
  const CLASS_DAYS = allClassDays.filter(day => weekdays.includes(day.weekday));

  const GRAD_DAYS = allClassDays.filter(day => day.description.includes('Graduation'));
  const GRAD_DAY = GRAD_DAYS.length > 0 ? moment(GRAD_DAYS[0].date) : null;


  let typedClassDays = CLASS_DAYS.map(classDay => {
    if ((type === 'CLIL' && classDay.type === 'Comm') || //mismatch junior type disgards the other type events
        (type === 'Comm' || type === 'G9') && classDay.type === 'CLIL' || //G7/8 Comm or G9 disgards CLIL events
        (type === 'Comm' && classDay.type === 'G9') ||//G7/8 Comm classes disgards G9 events
        (type === 'H') && (classDay.type === 'CLIL' || classDay.type === 'Comm')) //H class disgards Junior events
    {
      classDay.description = '';
      classDay.note = '';
    }

    return classDay;
  }).filter(classDay => {
    // Exclude null days
    if (classDay === null) return false;

    // Exclude days after graduationDay when type is 'G9'
    if (type === 'G9' && GRAD_DAY && moment(classDay.date).isAfter(GRAD_DAY)) return false;

    return true;
  });

  // get exam days
  let examDays = allClassDays.filter(day => day.description === 'Exam');

  // add 'Oral Exam days for Comm classes
  if (type!=='CLIL') {
    //find the first exam date for each term
    const firstExamDays = 
      (type === 'H')
      ? [examDays[4]]
      : GRAD_DAY
        ? [examDays[0], examDays[2]]
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

  // stores each term's class days count and off days count
  // not using the off days count now
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

  typedClassDays.sort((a, b) => moment(a.date).diff(moment(b.date)));
  // Find the index of the closest class day before the first exam day
  let zeroIndex = typedClassDays.findIndex(day => moment(day.date).isBefore(moment(examDays[0].date)) && day.description !== 'Off');

  // Add class count
  let termIndex = 0;
  let countdown = classCounts[termIndex].classes; // start at total classes

  typedClassDays = typedClassDays.map((day, index) => {
    // If we've reached the end of a term, move to the next term
    if (countdown <= 0 && termIndex < classCounts.length - 1) {
      termIndex++;
      countdown = classCounts[termIndex].classes; // reset to total classes for the next term
    }

    if (index >= zeroIndex && (day.description !== 'Off' && day.description !== 'Exam')) {
      day.countdown = countdown-1; // assign first
      countdown--; // then decrement
    } else {
      day.countdown = null; // set countdown to null if the day is an Exam day or Off
    }

    return day;
  });

  typedClassDays = typedClassDays.reverse();

  return typedClassDays;
}