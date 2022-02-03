import { development } from '../app-config';

//fetching api for distric code
export const DistrictCodeServices = async (portalCode) => {
  let response = await fetch(
    `${development.apiBaseUrl}/districts/districtLookup.cfm?validateRequest=1&portalCode=${portalCode}&studentApp=0`
  );
  return response;
};

//fetching api for search district by name
export const SearchDistrictServices = async () => {
  let response = await fetch(
    `${development.apiBaseUrl}/districts/initialDistrictData.cfm`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: 'Basic RealITiOSApp',
      },
    }
  );
  return response;
};

//fetching api for login authetication
export const LoginServices = async (formdata) => {
  let response = await fetch(`${development.apiBaseUrl}/security/login.cfm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: formdata,
  });
  return response;
};
