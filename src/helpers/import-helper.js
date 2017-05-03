'use strict';

const fse = require('fs-extra')

const { appServices, versionServices, contractServices } = require('./../services/services');
const { App, Version, Contract } = require('./../models/models');

const path = require('path');

const importAppsFiles = async function (appsRootDir) {
    let appsMapping = {}; //filepath => appObject
    let versionsMapping = {}; //filepath => versionObject
    let contractsMapping = {}; //filepath => contractObject

    let appToVersionMapping = {}; //app filepath => version filepath[]
    let versionToContractMapping = {}; //version filepath => contract filepath[]

    let appFolders = fse.readdirSync(appsRootDir);

    //loop to read all app folders
    appFolders.forEach((appFolder) => {
        let appFolderPath = path.join(appsRootDir, appFolder);
        let appJsonFilePath = path.join(appFolderPath, 'app.json');
        let appJson = fse.readJsonSync(appJsonFilePath);
        appsMapping[appJsonFilePath] = App.newFromAttributes(appJson);
        appToVersionMapping[appJsonFilePath] = [];

        let isVersionsFolderExist = fse.readdirSync(appFolderPath).includes('versions');
        if (isVersionsFolderExist) {
            let versionFolders = fse.readdirSync(path.join(appFolderPath, 'versions'));
            versionFolders.forEach((versionFolder) => {
                let versionFolderPath = path.join(appFolderPath, 'versions', versionFolder);
                let versionJsonfilePath = path.join(versionFolderPath, 'version.json');
                let versionJson = fse.readJsonSync(versionJsonfilePath);
                versionsMapping[versionJsonfilePath] = Version.newFromAttributes(versionJson);
                appToVersionMapping[appJsonFilePath].push(versionJsonfilePath);
                versionToContractMapping[versionJsonfilePath] = [];


                let isContractsFolderExist = fse.readdirSync(versionFolderPath).includes('contracts');
                if (isContractsFolderExist) {
                    let contractFiles = fse.readdirSync(path.join(versionFolderPath, 'contracts'));
                    contractFiles.forEach((contractFile) => {
                        let contractFilePath = path.join(versionFolderPath, 'contracts', contractFile);
                        let contractJs = fse.readFileSync(contractFilePath);
                        let contract = Contract.newFromScript(contractJs);
                        contractsMapping[contractFilePath] = contract;
                        versionToContractMapping[versionJsonfilePath].push(contractFilePath);
                    });
                }

            });
        }
    });

    let appIdMapping = {}; //filepath => appId
    let versionIdMapping = {}; //filepath => versionId
    let contractIdMapping = {}; //filepath => contractId

    for (let contractFilePath in contractsMapping) {
        let contract = contractsMapping[contractFilePath];
        let error, contractId, existingContract;

        let isCreate = true;
        if (contract.id) {
            [error, existingContract] = (await contractServices.get(contract.id)).get();
            if (existingContract) {
                isCreate = false;
            }
        }

        if (isCreate) {
            [error, contractId] = (await contractServices.create(contract)).get();
        } else {
            contractId = contract.id;
            [error] = (await contractServices.update(contract)).get();
        }

        contractIdMapping[contractFilePath] = contractId;
    }

    for (let appFilePath in appsMapping) {
        let app = appsMapping[appFilePath];
        let error, appId;
        [error, appId] = (await appServices.create(app)).get();
        appIdMapping[appFilePath] = appId;
    }

    for (let appFilePath in appToVersionMapping) {
        let appId = appIdMapping[appFilePath];

        let versionFilePaths = appToVersionMapping[appFilePath];

        for (let versionFilePath of versionFilePaths) {
            let version = versionsMapping[versionFilePath];
            let contractIds = versionToContractMapping[versionFilePath].map(contractFilPath => contractIdMapping[contractFilPath]);
            version.contracts = contractIds;

            let error;
            [error] = (await versionServices.create(appId, version)).get();
        }
    }

}

module.exports.importAppsFiles = importAppsFiles;