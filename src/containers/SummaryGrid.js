/* eslint array-callback-return: 0 */
import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import orderBy from 'lodash/orderBy';
import PropTypes from 'prop-types';
import { eachComponent } from 'formiojs/utils/formUtils';
import { Forms,UserMessages } from '../config';
import { i18next } from '../i18n';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
/* Create Tabular view component for reports/ summary for forms like CS-59 PK-13 etc
These components data will not be saved in the DB */

class SummaryGrid extends React.Component {
    getTotal=(rowValue1,rowValue2)=>{
        const sum=(rowValue1!==undefined && !isNaN(rowValue1)
                            ?Number.parseFloat(rowValue1):0)
                            +(rowValue2!==undefined && !isNaN(rowValue2)
                            ?Number.parseFloat(rowValue2):0);
        return sum;

    }
   
    getDifference=(rowValue1,rowValue2)=>{
        const difference = (rowValue1 !== undefined && !isNaN(rowValue1)
                            ?Number.parseFloat(rowValue1):0)
                         - (rowValue2 !== undefined && !isNaN(rowValue2)
                            ?Number.parseFloat(rowValue2):0);
        return difference;

    }
    getColumns = (form) => {

        const colHeading=[];
        eachComponent(form.components, (component) => {
           if (component.properties && component.properties.colHeading && component.properties.colSeq) {
            colHeading.push({
               headerName:i18next.t(component.label),field:component.key,seq:component.properties.colSeq,width:300 
   
            })
                 }            
          });
          const preDefinedColumns = orderBy(colHeading,'seq','asc');
       
        return preDefinedColumns;
    }

    getRows = (submissions,summaryColumn,form) => {
        
        const availableSubmission = submissions;
        const rowsvalue = [];
        let grandTotal=0;
        
        availableSubmission.filter(item => {
            
            const data1=item.data[ summaryColumn[ 0 ].field ];
            const data2=item.data[ summaryColumn[ 1 ].field ];
            const data3=item.data[ summaryColumn[ 2 ].field ];
            if(form._id===Forms.CS59.id){
               
                rowsvalue.push({ shift: i18next.t(data1), potatoType: i18next.t(data2),totalAmountDispensedTons: data3 })
            }
            else if(form._id===Forms.Followuponachievingplan.id){
                const data4=item.data[ summaryColumn[ 3 ].field ];
                const data5=item.data[ summaryColumn[ 4 ].field ];
                const data6=(data4/data3)*100;
                rowsvalue.push({ productType: i18next.t(data1), pKFlavorType: i18next.t(data2),plannedCases: data3,actualCases: data4, remainingCases: data5,performance: parseFloat(data6).toFixed(2) })
            }
            else if(form._id===Forms.PC7.id){
               
              rowsvalue.push({ shift: i18next.t(data1), potatoType: i18next.t(data2), leastSolid: data3 })
            }

        });
           //Logic specific for Followuponachievingplan form
     
        const preDefinedRows = orderBy(rowsvalue,summaryColumn[ 0 ].field,'asc');
        if(form._id===Forms.Followuponachievingplan.id){
            for (let i=0;i<preDefinedRows.length;i++){
                for (let j=i+1;j<preDefinedRows.length;j++){
                     if(preDefinedRows[ i ].productType===preDefinedRows[ j ].productType &&
                        preDefinedRows[ i ].pKFlavorType===preDefinedRows[ j ].pKFlavorType){                                                           
                           preDefinedRows[ i ].actualCases=this.getTotal(preDefinedRows[ i ].actualCases,preDefinedRows[ j ].actualCases);
                           preDefinedRows[ i ].remainingCases=this.getDifference(preDefinedRows[ i ].actualCases,preDefinedRows[ i ].plannedCases);
                           const performance=this.getTotal(preDefinedRows[ i ].performance,preDefinedRows[ j ].performance);                         
                           preDefinedRows[ i ].performance=parseFloat(performance).toFixed(2);
                           preDefinedRows.splice(j,1);
                           j=i;
                        }
               }
           }

        }
        //Logic specific for CS-59 form
        if(form._id===Forms.CS59.id || form._id===Forms.PC7.id){
            for (let i=0;i<preDefinedRows.length;i++){
                for (let j=i+1;j<preDefinedRows.length;j++){
                     if(preDefinedRows[ i ].shift===preDefinedRows[ j ].shift &&
                        preDefinedRows[ i ].potatoType===preDefinedRows[ j ].potatoType){   
                            if(form._id===Forms.CS59.id){
                                preDefinedRows[ i ].totalAmountDispensedTons=this.getTotal(preDefinedRows[ i ].totalAmountDispensedTons,preDefinedRows[ j ].totalAmountDispensedTons);                        
                            }                   
                           preDefinedRows.splice(j,1);
                           j=i;
                        }
               }
           }
           if(form._id===Forms.CS59.id){
                preDefinedRows.some(tot=>{
                    grandTotal+=tot.totalAmountDispensedTons!==undefined && !isNaN(tot.totalAmountDispensedTons) ? Number.parseFloat(tot.totalAmountDispensedTons):0 ;
                });
                preDefinedRows.push({ shift:'' , potatoType:'Total' ,totalAmountDispensedTons: grandTotal });
           }
           
        }
        return preDefinedRows;
    }
    
      onGridReady = params => {
        params.api.sizeColumnsToFit();
      };
    render = () => {
      
        const {
            form,
            submissions
        } = this.props;
        const columnDefs=this.getColumns(form);
        const rowData=submissions&&submissions.length>0? this.getRows(submissions,columnDefs,form):'';
        const domLayout= 'autoHeight';
        const defaultColDef= { resizable: true };
       
       return (

           <div className={ 'ag-theme-alpine' }> 
               {rowData?<AgGridReact
                    columnDefs={ columnDefs }
                    rowData={ rowData }
                    domLayout={ domLayout }
                    defaultColDef={ defaultColDef }
                    onGridReady={ this.onGridReady }
                />:
               <div className="pep-norecords">{i18next.t(UserMessages.NO_RECORDS_DAY)}</div>}
           </div>
        )
    }
    
}
SummaryGrid.propTypes = {
    form: PropTypes.object,
    submissions:PropTypes.object
    };
export default SummaryGrid
