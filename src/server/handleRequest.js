import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "../common/boot/app";
import configureStore from '../common/boot/configureStore';
import renderServerHTML from "./renderServerHTML";

export default function handleRequest(req, res) {
  const context = {};
  const store = configureStore();

  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={context}>
        <App />
      </StaticRouter>
    </Provider>
  );

  if (context.url) {
    res.redirect(302, context.url);
  } else {
    const status = context.status || 200;
    res.status(status).type("html").end(renderServerHTML({ html, state: store.getState() }));
  }
}
