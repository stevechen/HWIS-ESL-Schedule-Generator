
import moment from 'moment';
import getAllClassDays from './getAllClassDays'
/**
 * Retrieves all class days for a class type.
 * @param {Array <getAllClassDays>} classDays - CLIC, Comm, G9, H (High school)'.
 * @param {Array <number>} weekdays - which days are class days
 * @param {string} type - CLIC, Comm, G9, H (High school)'.
 */
export const getClassDaysByType = (classDays, weekdays, type) => {
  const filteredClassDays = classDays.filter(day => weekdays.includes(day.weekday));

  if (type === 'Comm') {
    let examDays = classDays.filter(day => day.description === 'Exam');
    let firstExamDays = [examDays[0], examDays[2], examDays[4]];
    // console.log ('first exam days: ' + JSON.stringify(firstExamDays))

  firstExamDays.forEach(theDay => {
    let examDate = moment(theDay.date);
    /** @type Array<Number> */
    let twoClassesBefore = [];
    
    filteredClassDays.forEach((classDay, index) => {
      let classDate = moment(classDay.date);
      if (examDate.diff(classDate, 'days') <= 2 && classDay.description !== 'Off') {
        twoClassesBefore.push(index);
      }
    });

    if (twoClassesBefore.length >= 2) {
      twoClassesBefore.slice(0, 2).forEach(index => {
        filteredClassDays[index].description = 'Oral Exam';
      });
    }

    });
  }

  return filteredClassDays;
}