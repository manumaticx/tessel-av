exports['av.Camera'] = {
  setUp(done) {
    this.sandbox = sinon.sandbox.create();
    this.emitter = new Emitter();
    this.spawn = this.sandbox.stub(cp, 'spawn', () => {
      this.emitter = new Emitter();
      this.emitter.kill = this.sandbox.stub();
      this.emitter.stderr = new Emitter();
      this.emitter.stdout = new Emitter();
      return this.emitter;
    });

    this.write = this.sandbox.stub(Writable.prototype, 'write');

    done();
  },

  tearDown(done) {
    this.sandbox.restore();
    done();
  },

  basic(test) {
    test.expect(1);
    test.equal(typeof av.Camera, 'function');
    test.done();
  },

  emitter(test) {
    test.expect(1);
    test.equal((new av.Camera()) instanceof Emitter, true);
    test.done();
  },

  capture(test) {
    test.expect(1);
    test.equal(typeof av.Camera.prototype.capture, 'function');
    test.done();
  },

  captureReadable(test) {
    test.expect(2);

    var cam = new av.Camera();
    var capture = cam.capture();

    test.equal(capture instanceof CaptureStream, true);
    test.equal(capture instanceof Readable, true);

    test.done();
  },

  captureToPipe(test) {
    test.expect(1);

    var buffer = new Buffer([0]);
    var cam = new av.Camera();
    var writable = new Writable();

    writable._write = function() {};

    writable.on('pipe', () => {
      test.ok(true);
      cam.stop();
      test.done();
    });

    cam.capture().pipe(writable);

    this.emitter.stdout.emit('data', buffer);
    this.emitter.emit('close');
  },

  spawned(test) {
    test.expect(3);

    var cam = new av.Camera();

    cam.capture();

    test.equal(this.spawn.callCount, 1);
    test.equal(this.spawn.lastCall.args[0], 'mjpg_streamer');
    test.deepEqual(this.spawn.lastCall.args[1], [
      '-i',
      '/usr/lib/input_uvc.so -n -q 100 -r 800x600 -f 30 -d /dev/video0 ',
      '-o',
      '/usr/lib/output_http.so -p 8080'
    ]);

    test.done();
  },

  stream(test) {
    test.expect(1);

    var cam = new av.Camera();

    cam.on('data', () => {
      test.ok(true);
      test.done();
    });
    cam.write(new Buffer(['a', 'b', 'c']));

  },

};
