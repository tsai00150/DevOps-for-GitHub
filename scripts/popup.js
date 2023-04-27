import { getDeploymentFrequency } from './action.js';
import { getDefectDensity } from './issues.js';


export async function drawChart(owner, repo, deploymentWorkflow, releaseWorkflow, timeUnit, startDate=null, endDate=null){
    google.charts.load('current', {'packages':['bar', 'line']});

    document.getElementById("owner").innerHTML = owner;
    document.getElementById("repo").innerHTML = repo;

    getDeploymentFrequency(owner, repo, deploymentWorkflow, releaseWorkflow, timeUnit, startDate, endDate)
      .then(filteredActions => {
          console.log(filteredActions)
          // document.getElementById("filteredActions").innerHTML = filteredActions;
          
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
          data1.addColumn('number', 'custom');
          for(let name of nameList){
            data1.addColumn('number', name);
            // console.log(name)  
          }
          
          let rowsToAdd1 = [];
          for(let i = 0; i < 12; i++){
            let rowToAdd = [];
            rowToAdd.push(i+1);
            for(let name of nameList){
              rowToAdd.push(counts[[name, i]] || 0);
            }
            rowsToAdd1.push(rowToAdd);
          }

          // console.log(rowsToAdd) 
          data1.addRows(rowsToAdd1);
        
          var options1 = {
            chart: {
              title: '',
              subtitle: '',
            },
            width: 400,
            height: 250,
            legend: {position: 'none'}
          };
        
          var chart1 = new google.charts.Line(document.getElementById('myChart11'));
        
          chart1.draw(data1, google.charts.Line.convertOptions(options1));



          
          let dataSource2 = [['number','Deploy Per Release']]
          let index = 1;
          for (let i = 0; i < 12; i++){
            if(rowsToAdd1[i][1] == 0 || rowsToAdd1[i][2] == 0){
              dataSource2.push([index+1, 0]);

            }
            else{
              dataSource2.push([index+1, rowsToAdd1[i][1]/rowsToAdd1[i][2]]);

            }
            index++;
          }
          // console.log(dataSource2)
          var data2 = google.visualization.arrayToDataTable(dataSource2);

          var options2 = {
            title: '',
            bars: 'vertical',
            legend: {position: 'none'} 
          };

          var chart2 = new google.charts.Bar(document.getElementById('myChart12'));

          chart2.draw(data2, google.charts.Bar.convertOptions(options2));
          
      });
    getDefectDensity(owner, repo, deploymentWorkflow)
      .then(metrics => {
          console.log(metrics)
          // document.getElementById("metrics").innerHTML = metrics;

          // let dataSource = [['metric #','defect density']]
          // let index = 1;
          // for (let input of metrics){
          //   dataSource.push(['metric'+index.toString(), input.toString()]);
          //   index++;
          // }
          // // console.log(dataSource)
          // var data = google.visualization.arrayToDataTable(dataSource);

          // var options = {
          //   title: 'Defect Density',
          //   bars: 'vertical',
          //   legend: {position: 'none'} 
          // };

          // var chart = new google.charts.Bar(document.getElementById('myChart2'));

          // chart.draw(data, google.charts.Bar.convertOptions(options));

          let index = 1;
          for (let input of metrics){
            // console.log(input)
            // console.log('metric'+index.toString()+'Name')
            // console.log('metric'+index.toString()+'Value')
            document.getElementById('metric'+index.toString()+'Name').innerHTML = 'metric'+index.toString();
            document.getElementById('metric'+index.toString()+'Value').innerHTML = input.toString();
            index++;
          }

      });
}