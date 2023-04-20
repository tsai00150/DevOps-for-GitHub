import { getDeploymentFrequency } from './action.js';
import { getDefectDensity } from './issues.js';


console.log("background")
const owner = 'appditto'
const repo = 'natrium_wallet_flutter'
getDeploymentFrequency(owner, repo, ['CI'], ['DEPLOY_RELEASE'], 'custom', new Date('2022-08-01T14:27:38Z'), new Date('2022-10-01T14:27:38Z'))
    .then(filteredActions => {
        console.log(filteredActions)  
        const counts = {};
        const names = [];
        const variables = [];
        filteredActions.forEach(function (x) { 
            counts[x] = (counts[x] || 0) + 1;
            variables.push(x[0]+','+x[1].toString())
            names.push(x[0]);
        });
        const set1 = new Set(variables);
        const set2 = new Set(names);
        const variableList = Array.from(set1);
        const nameList = Array.from(set2);
        let valueList = [];
        for(let variable of variableList){
            valueList.push(counts[variable]);
        }
        
        
        console.log("month")  
        for(let name of nameList){
          console.log(name)  
        }
        
        let rowsToAdd = [];
        for(let i = 0; i < 12; i++){
          let rowToAdd = [];
          rowToAdd.push(i+1);
          for(let name of nameList){
            rowToAdd.push(counts[[name, i]] || 0);
          }
          rowsToAdd.push(rowToAdd);
        }
  
        
        console.log(rowsToAdd)  
    });
getDefectDensity(owner, repo, ['CI'])
    .then(metrics => {
        console.log(metrics);
    });
