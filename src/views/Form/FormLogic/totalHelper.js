//Helper class to calculate the total logic of different forms, based on hourly/shift/day level

export const totalOfSubmissions = (
  submissions,
  currentPage,
  isFilter,
  submission
) => {
  let results = [];
  //  Build submissions data array
  if (isFilter) {
    if (submission.data.pC12FlavorType1 && submission.data.batchNumber1) {
      results = submissions
        .filter(
          (submissionList) =>
            submissionList.data.pC12FlavorType === submission.data.pC12FlavorType1 &&
            submissionList.data.batchNumber === submission.data.batchNumber1 &&
            (submissionList.metadata &&  parseInt(submissionList.metadata.viewPage) !== 1)

        )
        
        .map((item) => {
          return item.data;
        });
    }
  } else {
    results = submissions
      .filter(
        (item) =>
          item.metadata &&
          parseInt(item.metadata.viewPage) !== parseInt(currentPage)
      )
      .map((item) => {
        return item.data;
      });
  }

  // Concat values for same props in submissions data array

  const result =
    results.length === 0
      ? null
      : results.reduce((accum, item) => {
          for (const propertyName in item) {
            if (
              accum.hasOwnProperty(propertyName) &&
              typeof item[ propertyName ] === 'number' &&
              item[ propertyName ] !== undefined
            ) {
              accum[ propertyName ] += Number.parseFloat(item[ propertyName ]) || 0;
            } else {
              accum[ propertyName ] =
                typeof item[ propertyName ] === 'number'
                  ? Number.parseFloat(item[ propertyName ])
                  : accum[ propertyName ];
            }
          }
          return accum;
        }, {});

  return result;
};
