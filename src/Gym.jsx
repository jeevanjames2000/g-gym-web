import {
  Card,
  CardContent,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import React, { useState, useEffect, useRef, useCallback } from "react";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrScanner from "qr-scanner";

const Gym = () => {
  const [selectedSlot, setSelectedSlot] = useState("Slots Time");

  const scanner = useRef();
  const videoEl = useRef(null);
  const qrBoxEl = useRef(null);
  const [qrOn, setQrOn] = useState(true);
  const [scannedResult, setScannedResult] = useState({});
  const [access, setAccess] = useState(false);
  const [accessmsg, setAccessMsg] = useState([]);

  const [wait, setWait] = useState(0);
  const [present, setPresent] = useState([]);

  const [arrived, setArrived] = useState(0);

  const handleSlotChange = (event) => {
    setSelectedSlot(event.target.value);
  };
  const onScanSuccess = (result) => {
    try {
      const data = JSON.parse(result.data);
      UpdateAttendance(data);
      setScannedResult(data);

      setTimeout(() => {
        setScannedResult({});
      }, 3000);
    } catch (error) {
      console.error("Error parsing scan result: ", error);
    }
  };
  const onScanFail = (err) => {};

  const fetchGymSchedules = useCallback(
    async (Location, Date, selectedSlot) => {
      try {
        const response = await fetch(
          `https://sports1.gitam.edu/slot/gym/getAdminslotsCountByTimeAndDate/${Location}/${selectedSlot}/${Date}`
        );

        const data = await response.json();

        if (response.ok) {
          setWait(data.waiting);
          setArrived(data.arrived);
          setPresent(data.present);
        }
      } catch (error) {}
    },
    [selectedSlot]
  );

  const UpdateAttendance = async (dataToPost) => {
    try {
      const response = await fetch(
        "https://sports1.gitam.edu/api/gym/updateGymSchedule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            regdNo: dataToPost.regdNo,
            start_time: dataToPost.start_time,
            start_date: dataToPost.start_date,
            id: dataToPost.id,
            masterID: dataToPost.masterID,
          }),
        }
      );
      const result = await response.json();

      if (response.status === 200) {
        setAccess(true);
        setAccessMsg([
          { auth: "Access Granted" },
          {
            message: `Welcome to Gitam Gym!`,
          },
        ]);
      } else if (response.status === 400 || 404 || 500) {
        setAccess(false);
        setAccessMsg([{ auth: "Access Denied" }, { message: result }]);
      }
    } catch (error) {
      setAccess(false);
      setAccessMsg([
        { auth: "Access Denied" },
        { message: "Failed to update" },
      ]);
    }
  };

  useEffect(() => {
    if (videoEl?.current && !scanner.current) {
      scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
        onDecodeError: onScanFail,
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        overlay: qrBoxEl?.current || undefined,
      });
      scanner?.current
        ?.start()
        .then(() => setQrOn(true))
        .catch((err) => {
          if (err) setQrOn(false);
        });
    }
    return () => {
      if (!videoEl?.current) {
        scanner?.current?.stop();
      }
    };
  }, []);
  useEffect(() => {
    const currentDate = new Date().toISOString().split("T")[0];
    fetchGymSchedules("Block-C", currentDate, selectedSlot);
    // if (!qrOn)
    //   alert(
    //     "Camera is blocked or not accessible. Please allow camera in your browser permissions and Reload."
    //   );
    // if (scannedResult) {
    //   alert(scannedResult);
    // }
  }, [qrOn, scannedResult, selectedSlot]);

  return (
    <>
      <Grid container spacing={4} justifyContent="center" alignItems="center">
        <Grid
          spacing={4}
          item
          size={{ xs: 12, md: 12 }}
          style={{ margin: "2rem" }}
        >
          {/* Header */}
          <Typography
            variant="h4"
            textAlign="center"
            style={{
              fontWeight: "bold",
              color: "#B20016",
              marginBottom: "1rem",
            }}
          >
            Gym Block-C
          </Typography>

          <Grid
            item
            container
            justifyContent="center"
            size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
          >
            <video
              ref={videoEl}
              style={{ height: "10rem", width: "10rem" }}
            ></video>
          </Grid>

          {scannedResult.regdNo && (
            <Grid container justifyContent="center" spacing={2}>
              <Grid item size={{ xs: 12 }}>
                <Card
                  style={{
                    height: "80%",
                    padding: "1rem",
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <Grid container>
                    <Grid item size={{ xs: 12 }}>
                      <Typography
                        variant="h6"
                        style={access ? styles.successText : styles.errorText}
                      >
                        {accessmsg[0]?.auth || "Access Message"}
                      </Typography>
                      <Typography
                        variant="h6"
                        style={access ? styles.successText : styles.errorText}
                      >
                        {accessmsg[1]?.message || "Access Message"}
                      </Typography>
                    </Grid>
                    {/* First Column (Regd No and Campus) */}
                    <Grid item size={{ xs: 6 }}>
                      <Typography style={{ textAlign: "justify" }} gutterBottom>
                        Regd No: {scannedResult.regdNo}
                      </Typography>
                      <Typography style={{ textAlign: "justify" }} gutterBottom>
                        Campus: {scannedResult.campus}
                      </Typography>
                    </Grid>

                    <Grid item size={{ xs: 6 }}>
                      <Typography style={{ textAlign: "justify" }} gutterBottom>
                        Location: {scannedResult.Location}
                      </Typography>
                      <Typography style={{ textAlign: "justify" }} gutterBottom>
                        Date: {scannedResult.start_date}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          )}

          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            style={{
              borderBottom: "2px solid #B20016",
              paddingBottom: "0.5rem",
            }}
          >
            <Typography variant="h6" style={{ color: "#B20016" }}>
              Block-C - {selectedSlot}
            </Typography>
            <Select
              value={selectedSlot}
              onChange={handleSlotChange}
              displayEmpty
              style={{
                width: "10rem",
                height: "2.5rem",
                backgroundColor: "#00695c",
                color: "white",
              }}
            >
              {/* Menu Items */}
              {[
                "Slots Time",
                "5:00 AM",
                "6:00 AM",
                "7:00 AM",
                "8:00 AM",
                "9:00 AM",
                "10:00 AM",
                "11:00 AM",
                "12:00 PM",
                "1:00 PM",
                "2:00 PM",
                "3:00 PM",
                "4:00 PM",
                "5:00 PM",
                "6:00 PM",
                "7:00 PM",
                "8:00 PM",
                "9:00 PM",
              ].map((time) => (
                <MenuItem
                  key={time}
                  value={time}
                  style={{
                    height: "1.5rem",
                    justifyContent: "center",
                    width: "10rem",
                  }}
                >
                  {time}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid
            container
            spacing={4}
            style={{
              marginTop: "0rem",
              padding: "2rem",
              backgroundColor: "#fff",
            }}
          >
            <Grid item>
              <Card
                style={{
                  height: "6rem",
                  width: "15rem",
                  border: "1px solid #B20016",
                }}
              >
                <CardContent>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <Typography variant="h6">{wait}</Typography>
                      <Typography variant="body1">Waiting</Typography>
                    </div>
                    <DirectionsRunIcon
                      style={{ fontSize: "3rem", color: "#00695c" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Arrived Card */}
            <Grid item>
              <Card
                style={{
                  height: "6rem",
                  width: "15rem",
                  border: "1px solid #B20016",
                }}
              >
                <CardContent>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <Typography variant="h6">{arrived}</Typography>
                      <Typography variant="body1">Arrived</Typography>
                    </div>
                    <FitnessCenterIcon
                      style={{ fontSize: "3rem", color: "#00695c" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Table Section */}
          <Typography
            variant="h6"
            style={{ marginTop: "2rem", color: "#B20016" }}
          >
            Waiting
          </Typography>
          <TableContainer
            component={Paper}
            style={{
              border: "1px solid #B20016",
              marginTop: "0.5rem",
              backgroundColor: "#fff",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    "Sno",
                    "Regd Number",
                    "Start Date",
                    "Start Time",
                    "End Time",
                    "Location",
                    "Attendance",
                  ].map((heading) => (
                    <TableCell
                      key={heading}
                      style={{
                        borderBottom: "1px solid #B20016",
                        fontWeight: "bold",
                        color: "#B20016",
                      }}
                    >
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {present.length > 0 ? (
                  present.map((item, id) => (
                    <TableRow key={id}>
                      <TableCell>{id}</TableCell>
                      <TableCell>{item?.regdNo || "N/A"}</TableCell>
                      <TableCell>
                        {item?.start_date
                          ? new Date(item.start_date)
                              .toISOString()
                              .split("T")[0]
                          : "N/A"}
                      </TableCell>
                      <TableCell>{item?.start_time || "N/A"}</TableCell>
                      <TableCell>{item?.end_time || "N/A"}</TableCell>
                      <TableCell>{item?.Location || "N/A"}</TableCell>
                      <TableCell>{item?.attendance || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      style={{ textAlign: "center", padding: "1rem" }}
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
};

const styles = {
  successText: {
    color: "green",
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    margin: 0,
    fontWeight: "600",
    color: "#dc3545",
    textAlign: "center",
  },
};

export default Gym;
