import createAsyncActions from "../util/api/createAsyncActions";
import client from "../util/client";

export default createAsyncActions("BLOCK", [client, "getBlockByHeight"], ({ hash }) => {
  return [hash, true];
});
