//sets the sheets that will be used
var ss = SpreadsheetApp.getActiveSpreadsheet();
var schedule = ss.getSheetByName('schedule');
var info = ss.getSheetByName('NewMaster');
var legacy = ss.getSheetByName('Legacy');

//extract the doctor names from the abbreviations (done only once when the sheet opens)
var temp1 = ss.getSheetByName('Abbreviations').getRange('A2:A500').getValues().concat(ss.getSheetByName('Abbreviations').getRange('F2:F500').getValues());
var temp2 = ss.getSheetByName('Abbreviations').getRange('B2:B500').getValues().concat(ss.getSheetByName('Abbreviations').getRange('G2:G500').getValues());
var abbrev = [];
var names = [];
for(var i = 0; i < temp1.length - 1; i++) {
  abbrev.push(temp1[i][0]);
  names.push(temp2[i][0]);
}

//extract the medical student names from the abbreviations (done only once when the sheet opens)
var temp1 = ss.getSheetByName('Abbreviations').getRange('O2:O1000').getValues();
var temp2 = ss.getSheetByName('Abbreviations').getRange('P2:P1000').getValues();
var med_students_abbrev = [];
var med_students_names = [];
for(var i = 0; i < temp1.length - 1; i++) {
  med_students_abbrev.push(temp1[i][0]);
  med_students_names.push(temp2[i][0]);
}

//-----------------------------------------------------------------------------------------------------------------------------------------

//updates the month and year in cell A1, then calls for a full refresh of the schedule calendar
function changeMonthSchedule() {
  //retrieves the date and year from the dropdown menus 
  var month = schedule.getRange(2, 9).getValue();
  var year = schedule.getRange(2, 10).getValue().toString();
  
  //only updates the date and refreshes the calendar if the valid dropdown options have been selected
  if (month == "January" || month == "February" || month == "March" || month == "April" || month == "May" || month == "June" || month == "July" || month == "August" || month == "September" || month == "October" || month == "November" || month == "December" && year != "") {
    var date = new Date();
    var full_date = month + " 1 " + year;
    schedule.getRange(1,1).setValue('=DATE(YEAR("' + full_date + '"), MONTH("' + full_date + '"), 1)');
    
    //refreshes the schedule calendar
    refreshCalendarSchedule();
  }
}

//call to refresh the schedule calendar
function refreshCalendarSchedule() {
  //set the date that it was updated
  var date = new Date();
  schedule.getRange(17, 1).setValue("Notes: Last updated " + date);
  //loops through clearing old cell values and sets the background colour for unused cells
  for(var a = 5; a < 16; a+=2) {
    for(var b = 1; b < 8; b++) {
      schedule.getRange(a, b).setValue("");
      if(schedule.getRange(a - 1, b).getValue() == "") {
        //sets grey if outside the valid date for a respetive month
        schedule.getRange(a, b).setBackground("grey");
        schedule.getRange(a - 1, b).setBackground("grey");
      }
      else {
        //sets white if within the valid date for a respetive month
        schedule.getRange(a, b).setBackground("white");
        schedule.getRange(a - 1, b).setBackground("white");
      }
    }
  }
  
  //flag for ensuring the start of the month isn't missed
  var flag = false; 
  //loops through the calendar and updates the dates with the current extracted information
  for(var a = 5; a < 16; a+=2) {
    for(var b = 1; b < 8; b++) {
      //main date, appears in the first cell
      var main_date = schedule.getRange('A1').getValue();
      //individual day at point in the loop through the calendar
      var day = schedule.getRange(a-1, b).getValue();
      //creates the official date based on main and day
      main_date.setDate(main_date.getDate() + (day - 1));
      
      //ensures the start of month isn't skipped
      if(day == "" && i > 7) {
        flag = true;  
        break;
      } 
      //skips the calendar date if the date doesn't exist
      if(day == "") {
        continue;
      }
      //scan date column of Newmaster and extract the row information
      var column = info.getRange('B4:B10000');
      var rangeValues = column.getValues();
      var y = column.getLastRow();
      var calendar_vals = [];

      //validate that the values selected are within the correct month (example: only values in September 2019)
      for(var i = 0; i < y - 1; i++) {
        if(main_date.getDate() == rangeValues[i][0].getDate() && main_date.getMonth() == rangeValues[i][0].getMonth() && main_date.getYear() == rangeValues[i][0].getYear()) {
          var row = info.getRange('C' + (i+4) + ":P" + (i+4))
          calendar_vals = row.getValues();
          break;
        }
      }
     
      //convert abbreviations to full names
      var updated_cal = [names[abbrev.indexOf(calendar_vals[0][7])], //J (RMHAT)
                         names[abbrev.indexOf(calendar_vals[0][8])], //K (CL) 
                         names[abbrev.indexOf(calendar_vals[0][9])], //L (ECT)             
                         names[abbrev.indexOf(calendar_vals[0][13])],//P (ED)
                         names[abbrev.indexOf(calendar_vals[0][10])],//M (BITT)
                         names[abbrev.indexOf(calendar_vals[0][11])],//N (BITT)
                         names[abbrev.indexOf(calendar_vals[0][12])],//O (ACT)
                         names[abbrev.indexOf(calendar_vals[0][0])], //C
                         names[abbrev.indexOf(calendar_vals[0][1])], //D
                         names[abbrev.indexOf(calendar_vals[0][2])], //E
                         names[abbrev.indexOf(calendar_vals[0][3])], //F
                         names[abbrev.indexOf(calendar_vals[0][4])], //G
                         names[abbrev.indexOf(calendar_vals[0][5])], //H
                         names[abbrev.indexOf(calendar_vals[0][6])], //I
                        ];
      
      //properly formats the names (Dr. First_Initial Last_Full)
      for(var i = 0; i < updated_cal.length; i++) {
        if(updated_cal[i] != ""){
          //sets the value to blank if the name looked up doesn't exist in the Abbreviations sheet
          try {
            var split_names = updated_cal[i].split(" ");
            updated_cal[i] = "Dr. " + split_names[0][0] + ". " + split_names[split_names.length - 1];
          }
          catch(err) {
            updated_cal[i] = "";
          }
        }
      }
      
      //double loop for appending the correct work position and prevents repeated names from being listed in the calendar
      var temp_name = "";
      for(var i = 0; i < updated_cal.length; i++) {
        if(updated_cal[i] != ""){
          temp_name = updated_cal[i]
          if(i == 0) {
            updated_cal[i] = updated_cal[i] + " (RMHAT)";
          }
          else if(i == 1) {
            updated_cal[i] = updated_cal[i] + " (CL)";
          }
          else if(i == 2) {
            updated_cal[i] = updated_cal[i] + " (ECT)";
          }
          else if(i == 3) {
            updated_cal[i] = updated_cal[i] + " (ED)";
          }
          else if(i == 4 || i == 5) {
            updated_cal[i] = updated_cal[i] + " (BITT)";
          }
          else if(i == 6) {
            updated_cal[i] = updated_cal[i] + " (ACT)";
          }
          else if(i == 7) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 8) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 9) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 10) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 11) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 12) {
            updated_cal[i] = updated_cal[i];
          }
          else if(i == 13) {
            updated_cal[i] = updated_cal[i];
          }
        }
        else {
          continue
        }
        for(var j = i + 1; j < updated_cal.length; j++) {
          if(temp_name == updated_cal[j]) {
            if(j == 1) {
              updated_cal[i] = updated_cal[i] + " (CL)";
              updated_cal[j] = "";
            }
            else if(j == 2) {
              updated_cal[i] = updated_cal[i] + " (ECT)";
              updated_cal[j] = "";
            }
            else if(j == 3) {
              updated_cal[i] = updated_cal[i] + " (ED)";
              updated_cal[j] = "";
            }
            else if(j == 4 || j == 5) {
              updated_cal[i] = updated_cal[i] + " (BITT)";
              updated_cal[j] = "";
            }
            else if(j == 6) {
              updated_cal[i] = updated_cal[i] + " (ACT)";
              updated_cal[j] = "";
            }
            else if(j == 7) {
              updated_cal[j] = "";
            }
            else if(j == 8) {
              updated_cal[j] = "";
            }
            else if(j == 9) {
              updated_cal[j] = "";
            }
            else if(j == 10) {
              updated_cal[j] = "";
            }
            else if(j == 11) {
              updated_cal[j] = "";
            }
            else if(j == 12) {
              updated_cal[j] = "";
            }
            else if(j == 13) {
              updated_cal[j] = "";
            }
          }
        }
      }
      
      //appends the modified string to the dated cell
      var cell_val = "";
      for(var i = 0; i < updated_cal.length; i++) {
        if(updated_cal[i] != "") {
          cell_val = cell_val + updated_cal[i] +"\n"
        }
      }
      schedule.getRange(a, b).setValue(cell_val);
    }
    if(flag) {
      break;
    }
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------------

//updates the month and year in cell A19, then calls for a full refresh of the weekend/weekday calendar
function changeMonthWeekend() {
  //retrieves the date and year from the dropdown menus
  var month = schedule.getRange(20, 9).getValue();
  var year = schedule.getRange(20, 10).getValue().toString();
  
  //only updates the date and refreshes the calendar if the valid dropdown options have been selected
  if (month == "January" || month == "February" || month == "March" || month == "April" || month == "May" || month == "June" || month == "July" || month == "August" || month == "September" || month == "October" || month == "November" || month == "December" && year != "") {
    var date = new Date();
    var full_date = month + " 1 " + year;
    schedule.getRange(19,1).setValue('=DATE(YEAR("' + full_date + '"), MONTH("' + full_date + '"), 1)');
    
    //refreshes weekend/weekday calendar
    refreshCalendarWeekends();
  }
}

//call to refresh the weekend/weekday calendar
function refreshCalendarWeekends() {
  //set the date that it was updated
  var date = new Date();
  schedule.getRange(34, 1).setValue("Notes: Last updated " + date);
  
  //loops through clearing old cell values and setting the background colour for unused cells
  for(var a = 23; a < 34; a+=2) {
    for(var b = 1; b < 8; b++) {
      schedule.getRange(a, b).setValue("");
      if(schedule.getRange(a - 1, b).getValue() == "") {
        //sets grey if outside the valid date for a respetive month
        schedule.getRange(a, b).setBackground("grey");
        schedule.getRange(a - 1, b).setBackground("grey");
      }
      //
      else {
        //sets white if within the valid date for a respetive month
        schedule.getRange(a, b).setBackground("white");
        schedule.getRange(a - 1, b).setBackground("white");
      }
    }
  }
  
  //flag for ensuring the start of the month isn't missed
  var flag = false; 
  //loops through the calendar and updates the dates with the current extracted information
  for(var a = 23; a < 34; a+=2) {
    for(var b = 1; b < 8; b++) {
      //main date, appears in the first cell
      var main_date = schedule.getRange('A19').getValue();
      //individual day at point in the loop through the calendar
      var day = schedule.getRange(a-1, b).getValue();
      //creates the official date based on main and day
      main_date.setDate(main_date.getDate() + (day - 1));
      
      //ensures the start of month isn't skipped
      if(day == "" && i > 7) {
        flag = true;  
        break;
      } 
      //skips the calendar date if the date doesn't exist
      if(day == "") {
        continue;
      }
      //scan date column of Newmaster and extract the row information
      var column = info.getRange('B4:B10000');
      var rangeValues = column.getValues();
      var y = column.getLastRow();
      var calendar_vals = [];
      
      //validate that the values selected are within the correct month (example: only values in September 2019)
      for(var i = 0; i < y - 1; i++) {
        if(main_date.getDate() == rangeValues[i][0].getDate() && main_date.getMonth() == rangeValues[i][0].getMonth() && main_date.getYear() == rangeValues[i][0].getYear()) {
          var row = info.getRange('Q' + (i+4) + ":S" + (i+4))
          calendar_vals = row.getValues();
          break;
        }
      }
      
      //convert abbreviations to full names
      var updated_cal = [names[abbrev.indexOf(calendar_vals[0][0])],
                         names[abbrev.indexOf(calendar_vals[0][1])],
                         med_students_names[med_students_abbrev.indexOf(calendar_vals[0][2])]
                        ];
      
      //properly formats the names (Dr. First_Initial Last_Full)
      for(var i = 0; i < updated_cal.length; i++) {
        if(updated_cal[i] != ""){
          //sets the value to blank if the name looked up doesn't exist in the Abbreviations sheet
          try {
            if(i == 2) {
              var split_names = updated_cal[i].split(" ");
              updated_cal[i] = split_names[0][0] + ". " + split_names[split_names.length - 1] + " (STU)";
            }
            else if(i == 1) {
              var split_names = updated_cal[i].split(" ");
              updated_cal[i] = "Dr. " + split_names[0][0] + ". " + split_names[split_names.length - 1] + " (RES)";
            }
            else {
              var split_names = updated_cal[i].split(" ");
              updated_cal[i] = "Dr. " + split_names[0][0] + ". " + split_names[split_names.length - 1];
            }
          }
          catch(err) {
            updated_cal[i] = "";
          }
        }
      }
      
      //appends the modified string to the dated cell
      var cell_val = "";
      for(var i = 0; i < updated_cal.length; i++) {
        if(updated_cal[i] != "") {
          cell_val = cell_val + updated_cal[i] +"\n"
        }
      }
      schedule.getRange(a, b).setValue(cell_val);
    }
    if(flag) {
      break;
    } 
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------------
function legacyInfo() {
  var minLegacyValue = schedule.getRange('O2').getValue();
  var firstEmpty = schedule.getRange('M2').getValue();
  if(minLegacyValue < 4) {
    SpreadsheetApp.getActiveSpreadsheet().toast("The value must be at least '4' to legacy rows!");
  }
  else {
    info.getRange("A4:AN" + minLegacyValue).moveTo(legacy.getRange("A" + firstEmpty));
    info.getRange("A" + (minLegacyValue + 1) + ":AN").moveTo(info.getRange("A4"));
    schedule.getRange('O2').setValue("");
  }
}