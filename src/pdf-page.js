"use strict";

var r = require("react-wrapper");

module.exports = {
  propTypes: function () {
    return {
      pdf: r.propTypes.object.isRequired,
      scale: r.propTypes.number.isRequired,
      decodePageNumber: r.propTypes.func.isRequired,
      x: r.propTypes.number.isRequired,
      y: r.propTypes.number.isRequired
    };
  },

  componentDidMount: function () {
    this.updatePage();
  },

  componentDidUpdate: function () {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(function () {
        this.updatePage();
      }.bind(this),
      250);
  },

  updatePage: function () {
    if (!this.isBusy) {
      this.isBusy = true;
      var pageNumber = this.props.decodePageNumber(this.props);
      this.props.pdf.getPage(pageNumber).then(function (page) {
          if (this.isMounted()) {
            var viewport = page.getViewport(this.props.scale);
            var canvas = r.domNode(this).firstChild;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            var canvasContext = canvas.getContext("2d");
            page.render({
                canvasContext: canvasContext,
                viewport: viewport
              }).promise.then(function () {
                  this.isBusy = false;
                }.bind(this));
          }
        }.bind(this));
    } else if (!this.queueTimeout) {
      this.queueTimeout = setTimeout(function () {
          clearTimeout(this.queueTimeout);
          this.updatePage();
        }.bind(this),
        250);
    }
  },

  render: function () {
    return (
      r.div({
          className: "pdf-page",
          style: {
            width: "100%",
            height: "100%",
          }
        },
        r.canvas({
            style: {
              width: "100%",
              height: "100%",
              display: "block",
              WebkitTransform: "translateZ(0)"
            }
          })));
  }
};

r.makeComponent("PdfPage", module);
