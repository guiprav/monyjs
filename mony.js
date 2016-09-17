const mony = window.mony = {};

mony.fromTemplate = name => {
  const $el = $(`script[type="template/mony"][name="${name}"]`);

  if (!$el.length) {
    throw new Error(`No template with name '${name}'`);
  }

  return $($el.html());
};
