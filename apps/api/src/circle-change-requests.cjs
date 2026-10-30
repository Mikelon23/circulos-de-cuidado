const { createCircleChangeService } = require('./circle-change.cjs');

module.exports = {
  createCircleChangeService,
  createCircleChangeRequestService: createCircleChangeService,
  createCircleTransferService: createCircleChangeService,
  createRematchService: createCircleChangeService,
  createRematchRequestService: createCircleChangeService,
};
