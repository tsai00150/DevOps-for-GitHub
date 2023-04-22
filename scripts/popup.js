import { getDeploymentFrequency } from './action.js';
import { getDefectDensity } from './issues.js';

export async function drawChart(){
    google.charts.load('current', {'packages':['bar', 'line']});

    const owner = 'appditto'
    const repo = 'natrium_wallet_flutter'
    document.getElementById("owner").innerHTML = owner;
    document.getElementById("repo").innerHTML = repo;

    getDeploymentFrequency(owner, repo, ['CI'], ['DEPLOY_RELEASE'], 'custom', new Date('2022-08-01T14:27:38Z'), new Date('2022-10-01T14:27:38Z'))
      .then(filteredActions => {
          // console.log(filteredActions)
          document.getElementById("filteredActions").innerHTML = filteredActions;
          
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
          var data = new google.visualization.DataTable();
          data.addColumn('number', 'month');
          for(let name of nameList){
            data.addColumn('number', name);
            // console.log(name)  
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

          // console.log(rowsToAdd) 
          data.addRows(rowsToAdd);
        
          var options = {
            chart: {
              title: 'Deployment Frequency',
              subtitle: '',
              legend: {position: 'in'}
            },
            width: 400,
            height: 500
          };
        
          var chart = new google.charts.Line(document.getElementById('myChart1'));
        
          chart.draw(data, google.charts.Line.convertOptions(options));
          
      });
    getDefectDensity(owner, repo, ['CI'])
      .then(metrics => {
          // console.log(metrics)
          document.getElementById("metrics").innerHTML = metrics;

          let dataSource = [['metric #','defect density']]
          let index = 1;
          for (let input of metrics){
            dataSource.push(['metric'+index.toString(), input.toString()]);
            index++;
          }
          console.log(dataSource)
          var data = google.visualization.arrayToDataTable(dataSource);

          var options = {
            title: 'Defect Density',
            bars: 'vertical',
            legend: {position: 'none'} 
          };

          var chart = new google.charts.Bar(document.getElementById('myChart2'));

          chart.draw(data, google.charts.Bar.convertOptions(options));
      });
}