const {google} = require('googleapis');
const axios = require('axios').default;
const FormData = require('form-data');

const SCOPES = ['https://www.googleapis.com/auth/drive'];
//IDs for client folders of salesmen
const salesmanID = {'Jim Schwartz': '18MNuOEyoqqXRNSki7RX7biWWVdSrcXv2', 'Mark Anthony': '1M6NUf-7m0lRfOtP_3ZuNtzA6KlzSjg37', 'Samanthas Shared Folder': '1qEBWVWjh9rafF5YjP70VZSMzhoVBU5wJ'};
//Subfolders
const subfolderNames = ['Archive - ', 'Design - ','FSVF - ', 'PG&E Info - ', 'Service - ', 'Shade Analysis - ', 'True Up Analysis - '];
const designSub = ['Design Archive - ', 'Job Folder Docs - ', 'Site Survey - ', 'SV Photos - '];
const FSVFsub = ['Installation Photos - '];
const shadeSub = ['Shade Analysis Archive - '];
//const storageSub = ['Signed Docs - ', 'Well Photos - '];

const mainFolderContents = [
    {   
        key: 'Storage Proposal V1.8 7-7-21 - Last, First', 
        value: '1YeGZZAuFhJeRRU_atonFSPaPBln1JoyXo5-TqJJD3CY'
    },
    {
        key: 'Competition Calculator - Last, First', 
        value: '1sm3maBZAlpFSJqmfTI0OHHfVrOpUPrSJ-BWcrm7QgZ0'
    },
    {
        key: 'Pricing Tool V4 - 7.7.2021 - Last, First - Watch for Errors!!!', 
        value: '1ZcFIRTJK6ZiPNQ_EQnGsHD-A3zKtau4U9hQXotRehTY'
    },
    {
        key: 'Pricing Tool V4 - 9.3.2020 - Last, First', 
        value: '1tib8iq-lPW790cNd023RKOcSqDWzJG41jn2BQEwEC-U'
    }
]
const FSVFcontent = [
    {
        key: '1 - Last, First - FSVF cover letter/contact info', 
        value: '1C6aGmwiAK8N99XsmmYMiFzDje-py_h8LuU2sUMEalL0'
    }
]
const DesignContent = [
    {
        key: 'BOM Checklist - v2.3 9-30-20 - Last, First', 
        value: '1Me42QpVvuXO3dl6z6veK7NkvyBZ_7_Ft--kyyUSfRPw'
    },
    {
        key: 'Full Design and Layout V3 - 4-7-21 - Last, First', 
        value: '146G5H4_9nHqC1zBPpp2eff9_HWwtRI384Qq_s79jI3Y'
    },
    {
        key: 'Roof Drawing Template - Last, First', 
        value: '1dHh6M5QzJH4pqGadGTiLnczu12iDsHw_4762tSGXqFE'
    },
    {
        key: 'Site Visit Form Template - Ground Mount - 5_3_16 - Last, First', 
        value: '1RuLZPX-iPgR83Oxt8H4FU6OExDhMJeAnJKVgxQCj8WU'
    }, 
    {
        key: 'Site Visit Form Template V2 - Roof Mount - 6.5.19 - Last, First', 
        value: '1q9FN0T0OiCgQy2ByxB2u_ywxZNcuV6zpCSHgijjcH1M'
    }, 
    {
        key: 'Storage Site Visit Form Backup Loads - V2 - Last, First', 
        value: '14JypSmNIU5rb22ebFDlcrJfGG3s88NPWUAuSmGcUvv4'
    }
]
const TrueUpContent = [
    {
        key : 'True up Analysis - Last, First', 
        value: '19gKwhVzpcOxjBeZwkfzedvjRn652LpOYPqYjXgW5CzU'
    }
]
const PGEcontent = [
    {
        key: 'Utility Info v1.1 7-7-21 - Last, First', 
        value: '1PpP8_3jQ8l3gxGBTdtCHpmfy_N2rCfugApZRh_gLDqE'
    }
]


exports.myFunction = async (req, res) => {

    try{
      const params = new URLSearchParams(req.body); 
      const zohoLeadID = params.get('ID');
      const firstName = params.get('firstName');
      const lastName = params.get('lastName');
      let CLIENT_NAME = `${lastName}, ${firstName}`
      const salesman = params.get('Salesman');
      var ROOT_FOLDER_LOCATION = salesmanID['Mark Anthony'];
      
      //console.log(`client name: ${CLIENT_NAME}, zoholeadID: ${zohoLeadID}, salesman: ${salesman}, ROOT Loc: ${ROOT_FOLDER_LOCATION}`);

      const google = await authorize();
      const list = await search(google, ROOT_FOLDER_LOCATION, CLIENT_NAME);
      const rootFolder = await makeRoot(google, ROOT_FOLDER_LOCATION, CLIENT_NAME);
      const subfolders = await createSubfolder(CLIENT_NAME, rootFolder, google);
      const contents = await createContents(CLIENT_NAME, google, subfolders);
      //console.log(rootFolder);
      
      // Post back root folder
      var form = new FormData();
      form.append("arguments", JSON.stringify({"ID":`${zohoLeadID}`, "folderNumber": `https://drive.google.com/drive/u/2/folders/${rootFolder}`}));
      const axiosRes = await axios.post(
        'https://www.zohoapis.com/crm/v2/functions/cloudfunc/actions/execute?auth_type=apikey&zapikey=1003.3d46c1244e1b637bec9b67885545345a.8b1ea5cf1f12afa188975449b92971b0', 
        form, 
        { headers: form.getHeaders() }
      );

      res.status(200).send('Success');
    } catch (err) {
      console.log(err);
      res.status(500).send('Failed...');
    }

};


//Set Root
// function setROOT(ROOT_FOLDER_LOCATION) {
//   return new PromiseRejectionEvent((resolve, reject) => {
//     ROOT_FOLDER_LOCATION
//   })
// }

// Authorize drive API 
function authorize() {
  const auth = new google.auth.GoogleAuth({
      keyFile: 'creds.json',
      scopes: SCOPES
  })
  return google.drive({version: 'v3', auth})
}

// Search salesman folder for client
function search(driveService, ROOT_FOLDER_LOCATION, CLIENT_NAME) {
  return new Promise((resolve, reject) => {
      driveService.files.list({
          pageSize: 10,
          q: `'${ROOT_FOLDER_LOCATION}' in parents and name='${CLIENT_NAME}' and mimeType='application/vnd.google-apps.folder'`, 
          fields: 'files(id, name)'
      }).then(({data}) => resolve(data))
      .catch(err => reject(err))
  })
}

function makeRoot(drive, ROOT_FOLDER_LOCATION, CLIENT_NAME) {
  //add code to check if folder exists in ROOT_LOCATION
  if(ROOT_FOLDER_LOCATION!=undefined || ROOT_FOLDER_LOCATION!=null){
      var fileMetadata = {
          'name': CLIENT_NAME,
          'mimeType': 'application/vnd.google-apps.folder',
          'parents': [ROOT_FOLDER_LOCATION]
      };
      return new Promise((resolve, reject) => {
          const file = drive.files.create({
              resource: fileMetadata,
              fields: 'id'
          }, function(err, file) {
              if(err) {
                  reject(err);
              } else {
                  resolve(file.data.id);
              }
          })
  })}
  else{
      console.log(`Error--${CLIENT_NAME} root folder undefined`)
  }
}

const createSubfolder = async function otherMain(clientName, ROOT_FOLDER_ID, driveService) {
  try {
      let subfolderDict = [];
      subfolderDict.push({
          key: clientName,
          value: ROOT_FOLDER_ID
      });
      for(let folder of subfolderNames){
          let currentFolder = folder + clientName;
          let currentFileId = await createSubs(ROOT_FOLDER_ID, currentFolder, driveService);
          subfolderDict.push({
              key: currentFolder,
              value: currentFileId
          });
      }
      for(let folder of designSub){
          let rootFolderId = subfolderDict[2].value;
          let currentFolder = folder + clientName;
          let currentFileId = await createSubs(rootFolderId, currentFolder, driveService);
          subfolderDict.push({
              key: currentFolder,
              value: currentFileId
          });
      }
      for(let folder of FSVFsub){
          let rootFolderId = subfolderDict[3].value;
          let currentFolder = folder + clientName;
          let currentFileId = await createSubs(rootFolderId, currentFolder, driveService);
          subfolderDict.push({
              key: currentFolder,
              value: currentFileId
          });
      }
      for(let folder of shadeSub){
          let rootFolderId = subfolderDict[6].value;
          let currentFolder = folder + clientName;
          let currentFileId = await createSubs(rootFolderId, currentFolder, driveService);
          subfolderDict.push({
              key: currentFolder,
              value: currentFileId
          });
      }
    //   for(let folder of storageSub){
    //       let rootFolderId = subfolderDict[7].value;
    //       let currentFolder = folder + clientName;
    //       let currentFileId = await createSubs(rootFolderId, currentFolder, driveService);
    //       subfolderDict.push({
    //           key: currentFolder,
    //           value: currentFileId
    //       });
    //   }
      
      return subfolderDict;

  } catch (err) {
      console.log(err);
  }
}


function createSubs(ROOT_FOLDER_ID, subfolderName, driveService){
  var fileMetadata = {
      'name': subfolderName,
      'mimeType': 'application/vnd.google-apps.folder',
      'parents': [ROOT_FOLDER_ID]
  };
  return new Promise((resolve, reject) => {
      const file = driveService.files.create({
          resource: fileMetadata,
          fields: 'id'
      }, function(err, file) {
          if(err) {
              reject(err);
          } else {
              resolve(file.data.id);
          }
      })
  })
}

const createContents = async function createContent(clientName, driveService, subfolders){
    let contentsIds = [];
    try{
        //const id = await create(clientName, mainFolderContents['Storage Proposal'], driveService, subfolders[0].value);
        for(let content of mainFolderContents){
            let contentName = content.key.replace("Last, First", clientName);
            const contentId = await create(contentName, content.value, driveService, subfolders[0].value);
            contentsIds.push({
                key: contentName,
                value: contentId
            })
        }
        for(let content of DesignContent){
            let contentName = content.key.replace("Last, First", clientName);
            const contentId = await create(contentName, content.value, driveService, subfolders[2].value);
            contentsIds.push({
                key: contentName,
                value: contentId
            })
        }
        for(let content of FSVFcontent){
            let contentName = content.key.replace("Last, First", clientName);
            const contentId = await create(contentName, content.value, driveService, subfolders[3].value);
            contentsIds.push({
                key: contentName,
                value: contentId
            })
        }
        for(let content of PGEcontent){
            let contentName = content.key.replace("Last, First", clientName);
            const contentId = await create(contentName, content.value, driveService, subfolders[4].value);
            contentsIds.push({
                key: contentName,
                value: contentId
            })
        }
        for(let content of TrueUpContent){
            let contentName = content.key.replace("Last, First", clientName);
            const contentId = await create(contentName, content.value, driveService, subfolders[7].value);
            contentsIds.push({
                key: contentName,
                value: contentId
            })
        }

        return contentsIds;

    } catch (err) {
        console.log(err);
    }
}


function create(contentName, contentId, driveService, subfolder){
    
    var fileMetadata = {
        'name': contentName,
        'parents': [subfolder]
    };
    return new Promise((resolve, reject) => {
        const file = driveService.files.copy({
            'fileId': contentId,
            'resource': fileMetadata
        }, function(err, file) {
            if(err) {
                reject(err);
            } else {
                resolve(file.data.id);
            }
        })
    })
}
