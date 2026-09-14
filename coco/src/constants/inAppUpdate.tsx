// import InAppUpdates, {
//   IAUUpdateKind,
// } from 'react-native-in-app-updates';

// const inAppUpdates = new InAppUpdates(false);



// export const checkForAppUpdate = async () => {
//   try {
//     const result = await inAppUpdates.checkNeedsUpdate();

//     if (result.shouldUpdate) {
//       await inAppUpdates.startUpdate({
//         updateType: IAUUpdateKind.IMMEDIATE,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };