/****************************************************************************************
 * File Name    : tableInlineEdit
 * Author       : yj.kim
 * Date         : 2024-03-12
 * Description  : 
 * Modification Log
 * ===============================================================
 * Ver      Date 		Author    			Modification
 * ===============================================================
   1.0	    2024-03-12 	yj.kim			    Create
****************************************************************************************/
import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; // ToastMessage
import getContact from '@salesforce/apex/tableInlineEditController.getContact';
import { updateRecord } from "lightning/uiRecordApi";
import { refreshApex } from '@salesforce/apex';
import { RefreshEvent } from 'lightning/refresh';
const columns = [
    {label:'First Name',fieldName:'FirstName',type:'text',sortable:"true",editable:true},
    {label:'Last Name',fieldName:'LastName',type:'text',sortable:"true"},
    {label:'Phone',fieldName:'Phone',type:'phone',sortable:"true"},
    {label:'Email',fieldName:'Email',type:'email',sortable:"true"}
];

export default class TableInlineEdit extends LightningElement {
    columns = columns;
    data;
    draftValues;


    @wire(getContact)
    contactInfo(result, error){
        console.log('===== contactInfo =====');
        console.log(result);
        console.log(result.data);
        if(result){
            this.data = result;
        }else if(error){
            console.log('error 발생!');
            this.dispatchEvent(new ShowToastEvent({
               title : 'ERROR',
               message : 'Contact 데이터를 불러오는데 실패했습니다.',
               variant : 'ERROR'
            }))
        }
    }

    handleSave(event){
        this.draftValues = event.detail.draftValues;

        //배열일수도 있으니까 새로운 배열로 반환한다.
        //slice 메서드를 사용하는경우는 draftValues 의 원본 값을 복사해서 map 하기위해서..
        // {} 로 fields를 감싼 이유는
//        updateRecord({
//           fields: {
//               Id: this.recordId,
//               Stage__c: 'Assignment',
//               RequestDate__c : currentDate
//           }
//       })  해당 모형으로 맞춰야함..
        const inputValues = this.draftValues.slice().map((item) => {
            console.log(item);
            //얕은복사
            const fields = Object.assign({}, item);
            return { fields };
        });

        console.log(JSON.stringify(inputValues));
        console.log(inputValues);

        try{
             //Apex Controller 를 호출하지않고 LWC 의 UiApi 를 이용하여 전체 업데이트
             const updateContact = inputValues.map(contact => updateRecord(contact));

            // Promise 작업 한번에 실행하기 위해 Promise.all() 사용
             Promise.all(updateContact).then(res => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: '업데이트 성공!',
                        variant: 'success'
                    })
                );
                this.draftValues = [];
                 //refreshApex 를 사용함으로써 데이터를 다시 쿼리하고 UI를 새로 고친다. (wire getContact이 새로탐)
                refreshApex(this.data);

             }).catch(error => {
                  this.dispatchEvent(
                      new ShowToastEvent({
                          title: 'Error',
                          message: '업데이트 실패!',
                          variant: 'Error'
                      })
                  );
             }).finally(() => {
                console.log('끝');
                this.dispatchEvent(new RefreshEvent());
             });

        }catch(error){
            console.log('error');
        }
    }

}