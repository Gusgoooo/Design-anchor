export function sendJson(res, body, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function mutationOptions(payload) {
  return {
    dryRun: payload?.dryRun === true,
    confirmed: payload?.confirm === true || payload?.confirmed === true,
  };
}

export function requireMutationConfirm(res, payload, action) {
  const opts = mutationOptions(payload);
  if (!opts.dryRun && !opts.confirmed) {
    sendJson(
      res,
      {
        ok: false,
        error: `${action} requires confirm: true or dryRun: true`,
        confirmationRequired: true,
      },
      409,
    );
    return null;
  }
  return opts;
}
