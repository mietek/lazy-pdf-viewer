"use strict";

/* global PDFJS */

var r = require("react-wrapper");
var lazyScroller = r.wrap(require("lazy-scroller"));
var pdfPage = r.wrap(require("./pdf-page"));

module.exports = {
  propTypes: function () {
    return {
      author: r.propTypes.string.isRequired,
      year: r.propTypes.number.isRequired,
      title: r.propTypes.string.isRequired,
      url: r.propTypes.string.isRequired
    };
  },

  getInitialState: function () {
    return {};
  },

  componentWillMount: function () {
    PDFJS.getDocument(this.props.url).then(function (pdf) {
        if (this.isMounted() && pdf.numPages) {
          this.setState({
              pdf: pdf,
              pageCount: pdf.numPages,
              pageNumber: 1
            },
            function () {
              this.updatePageSize(1);
            }.bind(this));
        }
      }.bind(this));
  },

  updatePageSize: function (pageNumber) {
    if (this.state.pdf) {
      this.state.pdf.getPage(pageNumber).then(function (page) {
        if (this.isMounted()) {
          var viewport = page.getViewport(1);
          var pageWidth = Math.max(viewport.width, this.state.pageWidth || 0);
          var pageHeight = Math.max(viewport.height, this.state.pageHeight || 0);
          var isSizeChanged = (
            pageWidth !== this.state.pageWidth ||
            pageHeight !== this.state.pageHeight);
          if (isSizeChanged) {
            this.setState({
                pageWidth: pageWidth,
                pageHeight: pageHeight
              });
          }
          if (pageNumber < this.state.pageCount) {
            this.updatePageSize(pageNumber + 1);
          }
        }
      }.bind(this));
    }
  },

  componentDidMount: function () {
    addEventListener("resize", this.onResize);
    this.updateDocumentTitle();
    this.updateViewerSize();
  },

  componentWillUnmount: function () {
    removeEventListener("resize", this.onResize);
  },

  onResize: function (event) {
    window.requestAnimationFrame(function () {
        if (this.isMounted()) {
          this.updateViewerSize();
        }
      }.bind(this));
  },

  onRetarget: function (target) {
    var pageNumber = this.decodePageNumber(target);
    this.setState({
        pageNumber: pageNumber
      });
    this.updateDocumentTitle();
  },

  updateDocumentTitle: function () {
    var title = (
      this.props.author + " " +
      this.props.year + " — " +
      this.props.title);
    if (this.state.pageNumber) {
      title += " — p. " + this.state.pageNumber;
    }
    document.title = title;
  },

  updateViewerSize: function () {
    var node = r.domNode(this);
    var computed = getComputedStyle(node);
    var viewerWidth = parseFloat(computed.getPropertyValue("width"));
    var viewerHeight = parseFloat(computed.getPropertyValue("height"));
    var isSizeChanged = (
      viewerWidth !== this.state.viewerWidth ||
      viewerHeight !== this.state.viewerHeight);
    if (isSizeChanged) {
      this.setState({
          viewerWidth: viewerWidth,
          viewerHeight: viewerHeight
        });
    }
  },

  encodePageNumber: function (pageNumber) {
    return {
      x: 0,
      y: pageNumber - 1
    };
  },

  decodePageNumber: function (target) {
    return target.y + 1;
  },

  encodeTarget: function (target) {
    return "#" + this.decodePageNumber(target);
  },

  decodeTarget: function (hash) {
    if (!hash || hash[0] !== "#") {
      return undefined;
    }
    var pageNumber = parseInt(hash.slice(1));
    if (isNaN(pageNumber) || !pageNumber) {
      return undefined;
    }
    return this.encodePageNumber(pageNumber);
  },

  render: function () {
    var isReady = (
      this.state.pdf &&
      this.state.pageWidth &&
      this.state.viewerWidth);
    if (isReady) {
      var scale = this.state.viewerWidth / this.state.pageWidth;
      var pageRatio = this.state.pageHeight / this.state.pageWidth;
      var scaledWidth = Math.floor(this.state.pageWidth * scale);
      var scaledHeight = Math.floor(scaledWidth * pageRatio);
      return (
        lazyScroller({
            columnCount: 1,
            columnWidth: scaledWidth,
            rowCount: this.state.pageCount,
            rowHeight: scaledHeight,
            tileChild: pdfPage,
            tileChildProps: {
              pdf: this.state.pdf,
              scale: scale * 2,
              decodePageNumber: this.decodePageNumber
            },
            encodeTarget: this.encodeTarget,
            decodeTarget: this.decodeTarget,
            onRetarget: this.onRetarget
          }));
    } else {
      return (
        r.div({
            className: "pdf-viewer",
            style: {
              width: "100%",
              height: "100%"
            }
          }));
    }
  }
};

r.makeComponent("PdfViewer", module);
