import React from "react";
import {createRoot} from "react-dom/client"
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import App from "./App";
import "./App.scss";

const el = document.getElementById("app");

const root = createRoot(el);

root.render(
	<BrowserRouter basename="/dot">
		<Routes>
          		<Route path="/" element={<App />} />
       		</Routes>	
	</BrowserRouter>
);
