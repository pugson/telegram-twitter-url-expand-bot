import fetch from "node-fetch";

export const trackEvent = async (event) => {
  try {
    await fetch(`https://qckm.io?m=${event}&v=1&k=${process.env.QUICKMETRICS_TOKEN}`);
  } catch (error) {
    console.error(error);
  }
};
