
import moment from 'moment';
/**
 * Retrieves all class days for a class type.
 * @param {Array <{date: String, weekday: Number, description: String, note: String, type: String}>} classDays
 * @param {Array <number>} weekdays - which days are class days
 * @param {string} type - CLIC, Comm, G9, H (High school)'.
 */
export const getClassDaysByType = (classDays, weekdays, type) => {
  let commClassDays = classDays.filter(day => weekdays.includes(day.weekday));
  // console.log(JSON.stringify(filteredClassDays))
  
  // get exam days
  let examDays = classDays.filter(day => day.description === 'Exam');
  //find the first exam date for each term
  let firstExamDays = [examDays[0], examDays[2], examDays[4]];
  //sort in descending order so it would find the nearest none-off days prior to the exam date
  commClassDays.sort((a, b) => moment(b.date).diff(moment(a.date)));
  firstExamDays.sort((a, b) => moment(b.date).diff(moment(a.date)));

  // if it's a Comm class (***should add G7,G8 here)
  if (type === 'Comm') {
    //optimize the search for the two class days before the next exam by allowing the loop to start from where it left off in the previous iteration
    let startIndex = 0;
    //loop through the first exam date
    firstExamDays.forEach(theDay => {
      let examDate = moment(theDay.date);
      let daysMatched = 0;
      //compare first eaxm date with all comm class days
      for (let index = startIndex; index < commClassDays.length; index++) {
        let commClassDay = commClassDays[index];
        let allClassDay = moment(commClassDay.date);
        // collect the date if it's earlier than the exam day and it's not an off day
        if (allClassDay.isBefore(examDate) && commClassDay.description !== 'Off') {
          // mark matching day as 'Oral Exam'
          commClassDays[index].description = 'Oral Exam';
          daysMatched++;
          // console.log(commClassDays[index].date)
        }

        // if two days are marked
        if (daysMatched >= 2) {
          // set starting point for the next iteration
          startIndex += index;
          // breakout of the loop
          break;
        }
      }

     });
  }

  return commClassDays;
}