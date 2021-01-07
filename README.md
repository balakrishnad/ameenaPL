Form.io React Starter Application DEV
---------------------------------
This is a starter application that uses React, Bootstrap, Webpack, and Form.io to create a powerful Serverless application.

Installation
---------
 - Download this application within your local machine and then type the following.
```
npm install
```

 - Modify the ```src/config.js``` file to point the PROJECT_URL variable to the project you created in form.io.

Running
-----------
You can develop within this application by typing the following

```
npm start
```

This will launch the application locally @ https://localhost:3000. Now, whenever you make changes, those will be directly reflected within the launched application.


Building
------------
Once you have your application developed, it is now time to build the application for deployment. This can be done by following steps.

- Modify the ```src/config.js``` file to point if it is Demo build using `isDemo` variable.

```
npm run build
```

This will generate the **build** folder which you can then use to install within any webserver, Github Page, an Amazon S3 bucket, etc.



Deploying
------------
Once you have your application developed, it is now time to build the application for deployment. This can be done by typing the following.

- To deploy application to https://pepsico-dev.onform.io
```
npm run deploy:dev
```
- To deploy application to https://pepsico.onform.io
```
npm run deploy:prod
```

Commands
------------
To see all available commands type the following

```
npm run
```

FORM API KEYS
-------------------

Day Level forms :  
    Key: formType  Value : IsAllShiftDataNeeded //For now this is dayLevel- need to chnage this in formio forms
    [CS-59,PK-13]

KPI Reports:-
    Form's tab to have key- 
    kpiReport=true
    Field in that tab to have key - reportField and value as the fields API Name
    [Yet to be identified]

  /*For forms with day level calculations, remove other shift data for display purpose alone in hourly tabs
    Such form tabs should have api key  have "dispLevel" with value "shiftLevel" 
    dispLevel=shiftLevel */
    [RBS-03,CS-59,PK-13,PC-07,PC-12]

Shift->Hour Data flow:-
     dataFlow='shiftToHourTab'
     This is for forms which need data submitted at a shift level tab to be populated to each hourly tab added/edited
     [PK-33]

Forms With Calculations:
    Forms with caluclation logic- sum/total etc
    formCalculations=true
    [PK-13,PC-16,RBS-03,PK-33,PC-12]

Total caluclations Tab:
    totalPage=true
    [PC-16,PK-13,PC-12]

Shift Level Tabs:
    display=commonForShift

Mandatory fields in tab:
    requiredInSubmission=time,team ...[field API Name]
