/* eslint array-callback-return: 0 */
/* eslint no-useless-computed-key: 0 */
import { totalOfSubmissions } from '../FormLogic/totalHelper';
import { eachComponent } from 'formiojs/utils/formUtils';
export const reportCalculations = (
  form,
  currentPage,
  submissions,
  submission,
  mode
) => {
  submissions=getShiftLevelRecords(form,submissions,submission.data.shift);  
  const results = submissions
    .filter(
      (item) =>
        item.metadata &&
        parseInt(item.metadata.viewPage) === parseInt(currentPage) &&
        (mode === 'insert' || ((mode === 'edit' || mode ==='delete') && item._id !== submission._id))
    )
    .map((item) => {
      return item.data;
    });
  const shiftRecord = submissions
    .filter((item) => item.metadata && parseInt(item.metadata.viewPage) === 1)
    .map((item) => {
      return item;
    });
  
  submission._id = '';
  submission.metadata.viewPage= '1';
  submission.metadata.isOnline= navigator.onLine;
  submission.metadata.recordType= 'commonForShiftKPIAdded';
   

  //if delete dont push this to results
  if(mode !== 'delete'){
    results.push(submission.data);
  }
  if (shiftRecord.length !== 0) {
    submission._id = shiftRecord[ 0 ]._id;
    submission.data = shiftRecord[ 0 ].data;
    submission.metadata.recordType= 'commonForShiftKPIUpdated';
  }
  if(shiftRecord.length === 0 && results.length === 0 && mode ==='delete'){
    
    return;
   }
   if(results.length === 0 && mode ==='delete'){
    eachComponent(form.components, (component) => {
      if (component.properties && component.properties.reportField) {
          submission.data[ component.properties.reportField ] =0;
      }
    });
    return submission;
   }
  // eslint-disable-next-line no-unused-vars
  const result = results.reduce((accum, item) => {
    eachComponent(form.components, (component) => {
      if (component.properties && component.properties.reportField) {
        const consolidatedValue =
          item[ component.key ] !== undefined &&
          item[ component.key ] !== 'NaN' &&
          item[ component.key ] !== null &&
          item[ component.key ] !== ''
            ? Number.parseFloat(item[ component.key ])
            : 0;
        if (consolidatedValue !== 0) {
          if (accum.hasOwnProperty(component.properties.reportField)) {
            accum[ component.properties.reportField ] += consolidatedValue;
          } else {
            accum[ component.properties.reportField ] = consolidatedValue;
          }
          submission.data[ component.properties.reportField ] =
            accum[ component.properties.reportField ];
        }
      }
    });
    return accum;
  }, {});
  /**Code changed for PK-12 KPI report calculation [LN] starts */
  if (form && form.properties && form.properties.kpiPercentCalculation) {
    if (
      submission.data[ 'theoreticalSeasoningUseTotal' ] > 0 &&
      submission.data[ 'productionTotal' ] > 0
    ) {
      submission.data[ 'seasoningPercentage' ] =
        (submission.data[ 'theoreticalSeasoningUseTotal' ] /
          submission.data[ 'productionTotal' ]) *
        100;
    }
  }
  if (form && form.properties && form.properties.kpiThroughPutCalculation) {
    if (
      submission.data.line.includes('TC') &&
      submission.data[ 'seasoningPercentage' ] > 0
    ) {
      submission.data[ 'throughput' ] =
        1635 / (1 - submission.data[ 'seasoningPercentage' ] / 100 - 0.048);
      submission.data[ 'thruputConstant1' ] = 1635;
      submission.data[ 'thruputConstant2' ] = 0.048;
    }
    if (
      submission.data.line.includes('RBS') &&
      submission.data[ 'seasoningPercentage' ] > 0
    ) {
      submission.data[ 'throughput' ] =
        518.45 / (1 - submission.data[ 'seasoningPercentage' ] / 100 - 0.095);
      submission.data[ 'thruputConstant1' ] = 518.45;
      submission.data[ 'thruputConstant2' ] = 0.095;
    }
  }
  /**Code changed for PK-12 KPI report calculation [LN] ends */
  return submission;
};
export const formLevelValidations = (
  form,
  submissions,
  currentPage,
  isTotalLoaded,
  otherformData,
  shiftToHourFetch,
  isFilter,
  submission,
  shiftSel
) => {
  let value;

  if(form.components && form.components[ currentPage ] !== undefined && submissions.length !==0){
    submissions=getShiftLevelRecords(form.components[ currentPage ],submissions,shiftSel);
  };
  /* Populate data from shift level record to hour level records on load
      Component API key to be set as "displayFrom" and the value to be set as the 
      component api from which data is to be fetched from the shift tab */
  if (shiftToHourFetch && submissions && submissions.length !== 0) {
    const accum = {};
    submissions
      .filter(
        (item) =>
          item.metadata &&
          item.metadata.viewPage &&
          item.metadata.viewPage !== currentPage
      )
      .map((item) => {
        eachComponent(form.components, (component) => {
          if (
            component.properties &&
            component.properties.displayFrom &&
            component.defaultValue !==
              item.data[ component.properties.displayFrom ]
          ) {
            component.defaultValue =
              item.data[ component.properties.displayFrom ];
            accum[ component.key ] = item.data[ component.properties.displayFrom ];
          }
        });
      });
    return accum;
  }
  // Populate data from other forms in a newly created record
  // The FROM form component and TO form component should have property set as "formPick"
  // TO Form - Property value should be the API  key of the FROM form component eg:formPick-paestatus
  // FROM Form-Property value should be the API  key of the TO form component eg:formPick-pae
  if (otherformData !== null) {
    const accum = {};
    otherformData
      .filter((item) => item.data && item.data.shift)
      .map((item) => {
        eachComponent(form.components, (component) => {
          if (component.properties && component.properties.formPick) {
            component.defaultValue = item.data[ component.properties.formPick ];
            accum[ component.key ] = item.data[ component.properties.formPick ];
          }
        });
      });
    return accum;
  }

  if (
    form.display === 'wizard' &&
    !isTotalLoaded &&
    submissions.length &&
    form.components[ Number.parseFloat(currentPage) ].properties &&
    form.components[ Number.parseFloat(currentPage) ].properties.totalPage
  ) {
    // Initialize total count for forms with total calculation

    value = totalOfSubmissions(submissions, currentPage, isFilter, submission);
  }

  return value;
};
 /**Filtering out other shift  submissions for daylevel forms  [LN] starts */
export const getShiftLevelRecords= (form,submissions,currentShift) => {
 
  if (
    form &&
    form.properties &&
    form.properties.dispLevel &&
    form.properties.dispLevel === 'shiftLevel'
  ) {
    // eslint-disable-next-line no-param-reassign
    submissions = submissions
      .filter((item) => item.data && item.data.shift === currentShift)
      .map((item) => {
        return item;
      });
  }
  return submissions;


};
  /**Filtering out other shift  submissions for daylevel forms  [LN] ends */
  /**Check Shiftlevel record sanity to avoid duplicates  [LN] starts */

  export const setShiftLevelRecord= (form,submissions,submission,currentPage) => {
    if (
      form.form &&
      form.form.components[ currentPage ] &&
      form.form.components[ currentPage ].properties &&  form.form.components[ currentPage ].properties.display &&
      form.form.components[ currentPage ].properties.display ==='commonForShift'){
      submission.metadata.recordType= 'commonForShiftNew';
      if(submissions.length !==0){
        submissions = getShiftLevelRecords(form.form.components[ currentPage ],submissions,submission.data.shift);
        if(submissions.length !==0){
          const shiftRecord = submissions
          .filter((item) => item.metadata && parseInt(item.metadata.viewPage) === parseInt(currentPage))
          .map((item) => {
            return item;
          });
          if (shiftRecord.length !== 0){
            submission.metadata.recordType= 'commonForShiftUpdated';
            if(submission._id !==shiftRecord[ 0 ]._id) {
              submission._id = shiftRecord[ 0 ]._id;
            }
          } 
        }
      }     
    }
    return submission;
  };
  /**Check Shiftlevel record sanity to avoid duplicates  [LN] ends */

export const getTotalInEditMode = (
  form,
  submission,
  submissions,
  currentPage
) => {
  const accum = {};
  const availableSubmission = submissions
    .filter(
      (item) =>
        item.metadata &&
        item.metadata.viewPage &&
        item.metadata.viewPage !== currentPage &&
        item.data.pC12FlavorType === submission.data.pC12FlavorType1 &&
        item.data.batchNumber === submission.data.batchNumber1&&
        (item.metadata &&  parseInt(item.metadata.viewPage) !== 1)
      
    )
    .map((item) => {
      return item.data;
    });

  eachComponent(form.components, (component) => {
    if (component.properties && component.properties.totalFor) {
      if (availableSubmission.length === 0) {
        accum[ component.key ] = 0;
      } else {
        let total = 0;
        const totalForProperties = component.properties.totalFor.split(',');

        if (totalForProperties.length > 0) {
          totalForProperties.filter((value) => {
            availableSubmission.filter((key) => {
              for (const propName in key) {
                if (propName === value) {
                  total += key[ propName ];
                }
              }
            });
          });
        }
        accum[ component.key ] = total;
      }
    }
  });
  return accum;
};

