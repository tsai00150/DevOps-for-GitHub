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
              title: 'Deployment Frequency',
              subtitle: '',
            },
            width: 400,
            height: 250,
            legend: {position: 'none'}
          };
        
          var chart1 = new google.charts.Line(document.getElementById('myChart11'));
        
          chart1.draw(data1, google.charts.Line.convertOptions(options1));


          var data2 = new google.visualization.DataTable();
          data2.addColumn('number', 'custom');
          data2.addColumn('number', 'DeployPerRelease');
          let rowsToAdd2 = [];
          for(let i = 0; i < 12; i++){
            let rowToAdd = [];
            rowToAdd.push(i+1);
            rowToAdd.push(rowsToAdd1[i][1]/rowsToAdd1[i][2]);
            rowsToAdd2.push(rowToAdd);
          }
          data2.addRows(rowsToAdd2);
          var options2 = {
            chart: {
              title: 'Deployments Per Release',
              subtitle: '',
            },
            width: 400,
            height: 250,
            legend: {position: 'none'}
          };
        
          var chart2 = new google.charts.Line(document.getElementById('myChart12'));
        
          chart2.draw(data2, google.charts.Line.convertOptions(options2));
          
      });
    getDefectDensity(owner, repo, ['CI'])
      .then(metrics => {
          // console.log(metrics)
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
            console.log(input)
            console.log('metric'+index.toString()+'Name')
            console.log('metric'+index.toString()+'Value')
            document.getElementById('metric'+index.toString()+'Name').innerHTML = 'metric'+index.toString();
            document.getElementById('metric'+index.toString()+'Value').innerHTML = input.toString();
            index++;
          }

      });
}