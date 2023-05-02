import { getDeploymentFrequency } from './action.js';
import { getDefectDensity } from './issues.js';


export async function drawChart(owner, repo, deploymentWorkflow, releaseWorkflow, timeUnit, startDate=null, endDate=null){
    google.charts.load('current', {'packages':['bar', 'line']});

    document.getElementById("owner").innerHTML = owner;
    document.getElementById("repo").innerHTML = repo;

    getDeploymentFrequency(owner, repo, deploymentWorkflow, releaseWorkflow, timeUnit, startDate, endDate)
      .then(filteredActions => {
          
          let timeLength = 12;
          if(timeUnit == 'year'){
            timeLength = 4;
          }
          else{

          }

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
          var data1 = new google.visualization.DataTable();
          data1.addColumn('number', timeUnit);
          for(let name of nameList){
            data1.addColumn('number', name);
 
          }
          
          let rowsToAdd1 = [];
          for(let i = 0; i < timeLength; i++){
            let rowToAdd = [];
            rowToAdd.push(i);
            for(let name of nameList){
              rowToAdd.push(counts[[name, i]] || 0);
            }
            rowsToAdd1.push(rowToAdd);
          }

          data1.addRows(rowsToAdd1);
        
          var options1 = {
            chart: {
              title: '',
              subtitle: '',
              hAxis: {
                viewWindow: {
                    min: 0,
                    max: timeUnit
                },
              },
            },
            width: 400,
            height: 250,
            legend: {position: 'none'}
          };
        
          var chart1 = new google.charts.Line(document.getElementById('myChart11'));
        
          chart1.draw(data1, google.charts.Line.convertOptions(options1));



          
          let dataSource2 = [['number','Deploy Per Release']]
          let index = 0;
          for (let i = 0; i < timeLength; i++){
            if(rowsToAdd1[i][1] == 0 || rowsToAdd1[i][2] == 0){
              dataSource2.push([index, 0]);

            }
            else{
              dataSource2.push([index, rowsToAdd1[i][1]/rowsToAdd1[i][2]]);

            }
            index++;
          }

          var data2 = google.visualization.arrayToDataTable(dataSource2);

          var options2 = {
            title: '',
            bars: 'vertical',
            legend: {position: 'none'},
            viewWindow: {
                min: 0,
                max: timeUnit
            },
          };

          var chart2 = new google.charts.Bar(document.getElementById('myChart12'));

          chart2.draw(data2, google.charts.Bar.convertOptions(options2));
          
      });
    getDefectDensity(owner, repo, deploymentWorkflow)
      .then(metrics => {

          let index = 1;
          let metricName = ['Issues / Deployments', 'Issues / Sucessful Deployments', 'Sucessful Deployments / Deployments']
          for (let input of metrics){
            document.getElementById('metric'+index.toString()+'Name').innerHTML = metricName[index-1];
            document.getElementById('metric'+index.toString()+'Value').innerHTML = (Math.round(input*1000)/1000).toString();
            index++;
          }

      });
}