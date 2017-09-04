import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";

const { object, shape } = PropTypes;

const withStatus = (statusCode) => (Component) => {
  class StatusComponent extends React.Component {
    static displayName = `withStatus(${Component.displayName || Component.name})`;

    static contextTypes = {
      router: shape({ staticContext: object }).isRequired
    };

    componentWillMount = () => {
      const { staticContext } = this.context.router;

      if (staticContext) {
        staticContext.status = statusCode;
      }
    }

    render = () => {
      return <Component {...this.props} />;
    }
  }

  return withRouter(StatusComponent);
};

export default withStatus;
