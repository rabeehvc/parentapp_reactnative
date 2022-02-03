import { development } from '../app-config';

//fecth url for announcement screen - announsements
export const StudentServices = async (tokenvalue, distID, studentId) => {
  let response = await fetch(
    `${development.apiBaseUrl}/students/parentMobileAppHeadlinesByStudentID.cfm?districtID=${distID}&validateRequest=1&sel=${studentId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: tokenvalue,
      },
    }
  );
  return response;
};
