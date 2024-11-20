// timeUtils.js

// for "live" context
// don't need a function for this bc it's just going to look in the two dirs for the most recent file

// 
// export function getTimeOfInterest(baseTime, offsetHours) {
//     const time = new Date(baseTime);
//     // for each of these grab whichever file with that valid time has been updated most recently. E.g. for the nearest hour, it should typically be 2FH (we only ever consider files from 2 FH or more due to the lag with 1FH)
//     // round up to the nearest hour
//     // offset 1 hour future from that ^
//     // offset 2 hours future from that ^
//     // offset 6 hours future from that ^
//     // etc etc
//     // or make a dynamic dropdown hwere the user can select WHICH valid times are available to them
//     time.setHours(time.getHours() + offsetHours);
//     return time.toISOString();
// }

function roundTimeToHour(inputTime) {
    if (!(inputTime instanceof Date)) {
        throw new Error("Input must be a Date object");
    }

    const msInAnHour = 60 * 60 * 1000;
    const roundedTime = new Date(Math.round(inputTime.getTime() / msInAnHour) * msInAnHour);
    return roundedTime;
}
export {roundTimeToHour};

function datestring_tofilenamestring(input) {

    // console.log("entered otherscript datestring_tofilenamestring")
    // Split the date and time

    const [datePart, timePart] = input.split(' ');
    // if empty split, 2024-11-18_11:00

    // // Remove dashes from the date
    const formattedDate = datePart.replace(/-/g, '');

    // // Extract the hour from the time
    const [hour, min] = String(timePart).split(':');
  
    // console.log(`V${formattedDate}_${hour}`)

    // Combine the date and hour in the desired format
    return `V${formattedDate}_${hour}`;


  }

export {datestring_tofilenamestring};


// for forecast files, we want to look for valid times that are 1 hour, 2 hours, 4, hours, etc, into the future from the now (the moment when the user selects to see forecasts). So take the now time, and grab the forecast hours that the user can select from, dynamically based on when they loaded the forecast page. These will be sent back to the Map.js dropdown file 
function prepListForecastOptions(inputHour) {

    // console.log("beginning prepListForecastOptions")
    const oneHour = 60 * 60 * 1000;
    const twoHours = oneHour * 2;
    const fourHours = oneHour * 4;
    const eightHours = oneHour * 8;

    const hours = [
        new Date(inputHour.getTime() + oneHour),
        new Date(inputHour.getTime() + twoHours),
        new Date(inputHour.getTime() + fourHours),
        new Date(inputHour.getTime() + eightHours)
    ];

    console.log("got through here too")
    const listy = hours.map(date =>
        `Forecast for ${date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })} ET`
    );

    // console.log(listy)
    return listy
}

export {prepListForecastOptions};

function prepFileString_fcst(inputString) {
    // Check if the input string starts with the expected prefix
    const prefix = "Forecast for ";
    // console.log("heree")
    // console.log(inputString)
    if (!inputString.startsWith(prefix)) {
        console.error(`Input string does not start with "${prefix}": ${inputString}`);
        throw new Error("Invalid forecast string format");
    }

    // Remove the prefix
    const dateTimePart = inputString.slice(prefix.length);

    // Ensure the string contains a comma (to separate date and time)
    if (!dateTimePart.includes(", ")) {
        console.error(`Date and time part is not properly formatted: ${dateTimePart}`);
        throw new Error("Invalid forecast string format");
    }

    // Split the date and time part
    const [datePart, timePart] = dateTimePart.split(", ");

    // Check if both parts are non-empty
    if (!datePart || !timePart) {
        console.error(`Date or time part is missing: date="${datePart}", time="${timePart}"`);
        throw new Error("Invalid forecast string format");
    }

    // Extract the date components (month, day, year)
    const [month, day, year] = datePart.split("/");
    if (!month || !day || !year) {
        console.error(`Date part is not properly formatted: ${datePart}`);
        throw new Error("Invalid forecast string format");
    }

    // Extract the time components (hour, minutes, AM/PM)
    const [time, period] = timePart.split(" ");
    if (!time || !period) {
        console.error(`Time part is not properly formatted: ${timePart}`);
        throw new Error("Invalid forecast string format");
    }

    const [hour, minutes] = time.split(":");
    if (!hour || !minutes) {
        console.error(`Time is not properly formatted: ${time}`);
        throw new Error("Invalid forecast string format");
    }

    // Convert the hour to 24-hour format
    let hour24 = parseInt(hour, 10);
    if (period === "PM" && hour24 !== 12) {
        hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
        hour24 = 0;
    }

    // Format components with leading zeros
    const formattedMonth = month.padStart(2, "0");
    const formattedDay = day.padStart(2, "0");
    const formattedHour = String(hour24).padStart(2, "0");

    // Combine into the final string
    const result = `V${year}${formattedMonth}${formattedDay}_${formattedHour}`;
    // console.log("in timing helper functions");
    // console.log(result);
    return result;
}

export { prepFileString_fcst }; 


function prepFileString(inputHour) {
    // console.log("entered otherscript prepFileString")
    // console.log ("entering function in scrip!!")
    // console.log("printing the input:)")
    // console.log(inputHour)
    const year = inputHour.getFullYear();       // e.g., 2024
    // console.log (year)
    const month = inputHour.getMonth() + 1;    // e.g., 11 (Months are 0-based, so add 1)
    const date = inputHour.getDate();          // e.g., 15
    const hours = String(inputHour.getHours()).padStart(2, '0');  // Ensure two digits for hours
    const minutes = String(inputHour.getMinutes()).padStart(2, '0');  // Ensure two digits for minutes
    const datename = `${year}-${month}-${date} ${hours}:${minutes}`;

    // console.log(datename)
    return datename;
}
export {prepFileString};


// export default prepFileString;

// export function offsetHours

// export function prepFileString

// export function formatTimeString(time) {
//     const date = new Date(time);
//     return `${date.toDateString()} at ${date.toLocaleTimeString()}`;
// }

