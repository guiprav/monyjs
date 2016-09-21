const mony = window.mony = {};

const $html = $('html').css('visibility', 'hidden');

$(() => {
  $html.css('visibility', '');
});

mony.fromTemplate = name => {
  const $el = $(`script[type="template/mony"][name="${name}"]`);

  if (!$el.length) {
    throw new Error(`No template with name '${name}'`);
  }

  return $($el.html());
};

function cloneRepeatOriginal($el) {
  const originalKey = 'monyRepeatOriginal';

  let $original = $el.data(originalKey);

  if ($original) {
    return $original.clone(true, true);
  }

  $original = $el.clone(true, true);
  $original.data(originalKey, $original);

  return $original;
}

mony.repeat = ($el, array, fn) => {
  $el.slice(1).remove();
  $el = $el.first();

  const $elTempl = cloneRepeatOriginal($el);

  const newEls = array
    .map(data => fn($elTempl.clone(true, true), data))
    .reduce((a, b) => {
      if (a instanceof jQuery) {
        a = a.toArray();
      }

      if (b instanceof jQuery) {
        b = b.toArray();
      }

      if (!Array.isArray(a)) {
        a = [a];
      }

      if (!Array.isArray(b)) {
        b = [b];
      }

      return a.concat(b);
    });

  return $(newEls).replaceAll($el);
};

function recreateRepeatEl($el, data, fn) {
  return $(fn(cloneRepeatOriginal($el), data));
}

mony.insertAfter = ($el, data, fn) => {
  $el = $el.last();

  return recreateRepeatEl($el, data, fn)
    .insertAfter($el);
};

mony.insertBefore = ($el, data, fn) => {
  $el = $el.first();

  return recreateRepeatEl($el, data, fn)
    .insertBefore($el);
};

mony.routes = [];

mony.routes.notFound = {
  enter: req => console.error('Route not found:', req),
};

mony.route = (route, opt) => {
  mony.routes.push(Object.assign({}, opt, {
    route,
  }));
};

mony.routeNotFound = opt => {
  mony.routes.notFound = opt;
};

mony.matchRoute = (route, path) => {
  const routeNodes = route.split('/');
  const pathNodes = path.split('/');

  if (routeNodes.length !== pathNodes.length) {
    return null;
  }

  const params = {};

  const matches = routeNodes.every((routeNode, i) => {
    const pathNode = pathNodes[i];

    if (pathNode === undefined) {
      return false;
    }

    if (routeNode.startsWith(':')) {
      params[routeNode.slice(1)] = pathNode;
      return true;
    }

    return (routeNode === pathNode);
  });

  if (!matches) {
    return null;
  }

  return params;
};

mony.refresh = () => $(window).trigger('hashchange');

$(() => {
  const $wnd = $(window);

  const last = {};

  $wnd.on('hashchange', ev => {
    if (last.route && last.route.leave) {
      last.route.leave(last.req);
    }

    const path = location.hash.slice(1);

    last.req = {
      path,
    };

    const matched = mony.routes.some(reg => {
      const params = mony.matchRoute(reg.route, path);

      if (!params) {
        return false;
      }

      last.req.params = params;
      last.route = reg;

      if (last.route.enter) {
        last.route.enter(last.req);
      }

      return true;
    });

    if (!matched) {
      last.route = mony.routes.notFound;
      last.route.enter(last.req);
    }
  });
});
