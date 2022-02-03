import { development } from '../app-config';

export const latestNotification = async (SessionValue, distID, formdata) => {
  let response = await fetch(
    `${development.apiBaseUrl}/documents/retrieveRecentNotifications.cfm?jwt=${SessionValue}&districtID=${distID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formdata,
    }
  );
  return response;
};

export const NotificationSet = async (
  sessionValue,
  distID,
  studentid,
  deviceid
) => {
  let response = await fetch(
    `${development.apiBaseUrl}/students/retrieveNotificationSettings.cfm?districtID=${distID}&validateRequest=1&sel=${studentid}&deviceID=${deviceid}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: sessionValue,
      },
    }
  );
  return response;
};
//notification updates
export const NotificationUpdates = async (SessionValue, distID, formdata) => {
  let response = await fetch(
    `${development.apiBaseUrl}/students/updateNotificationSettings.cfm?jwt=${SessionValue}&districtID=${distID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formdata,
    }
  );
  return response;
};
