import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, TableRow, TableCell, TableBody, TableHead, Paper} from "@mui/material";


function JobIndex() {
    const [data, setData] = useState([
      {id: 1, name: "Example Job 1", inputs:0, status: "COMPLETE", outputs: 28.3546},
      {id: 2, name: "Example Job 2", inputs: 42, status: "COMPLETE", outputs: 585.51},
      {id: 3, name: "Example Job 3", inputs: 34234, status: "RUNNING", outputs: "-"}
    ]);
    function getJobColor(status) {
        if (status === "COMPLETE") {
            return "lightgreen"
        } 
        else if (status === "RUNNING") {
            return "orange"
        }
        else if (status === "FAILED") {
            return "red"
        }
    }

    return (
        <Card variant="plain" sx={{marginBottom:"10px"}}>
            <Typography variant="h4" textAlign={"center"} >
                Job Index
            </Typography>
          <Table component={Paper}>
          <TableHead>
              <TableRow>
              {/* Adjust headers based on your data sTableRowucture */}
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Inputs</TableCell> 
              <TableCell>Status</TableCell> 
              <TableCell>Outputs</TableCell> 
              </TableRow>
          </TableHead>
          <TableBody>
              {data.map(item => (
              <TableRow key={item.id} sx={{backgroundColor:getJobColor(item.status)}}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.inputs}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.outputs}</TableCell>

              </TableRow>
              ))}
          </TableBody>
          </Table>
      
      </Card>
    
    );
};

export default JobIndex;


// function JobIndex() {
//   const [loading, setLoading] = useState(TableRowue);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     async function fetchData() {
//       TableRowy {
//         const response = await fetch('YOUR_API_ENDPOINT'); // Replace wiTableCell your actual API endpoint
//         if (!response.ok) {
//           TableCellrow new Error(`HTTP error! status: ${response.status}`);
//         }
//         const jsonData = await response.json();
//         setData(jsonData);
//       } catch (err) {
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchData();
//   }, []);

//   if (loading) {
//     return <p>Loading data...</p>;
//   }

//   if (error) {
//     return <p>Error: {error.message}</p>;
//   }
