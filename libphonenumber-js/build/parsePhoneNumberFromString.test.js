"use strict";

var _parsePhoneNumberFromString2 = _interopRequireDefault(require("./parsePhoneNumberFromString"));

var _metadataMin = _interopRequireDefault(require("../metadata.min.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function parsePhoneNumberFromString() {
  for (var _len = arguments.length, parameters = new Array(_len), _key = 0; _key < _len; _key++) {
    parameters[_key] = arguments[_key];
  }

  parameters.push(_metadataMin["default"]);
  return _parsePhoneNumberFromString2["default"].apply(this, parameters);
}

var USE_NON_GEOGRAPHIC_COUNTRY_CODE = false;
describe('parsePhoneNumberFromString', function () {
  it('should parse phone numbers from string', function () {
    parsePhoneNumberFromString('Phone: 8 (800) 555 35 35.', 'RU').nationalNumber.should.equal('8005553535');
    expect(parsePhoneNumberFromString('3', 'RU')).to.be.undefined;
  });
  it('should work in edge cases', function () {
    expect(parsePhoneNumberFromString('')).to.be.undefined;
  });
  it('should parse phone numbers when invalid country code is passed', function () {
    parsePhoneNumberFromString('Phone: +7 (800) 555 35 35.', 'XX').nationalNumber.should.equal('8005553535');
    expect(parsePhoneNumberFromString('Phone: 8 (800) 555-35-35.', 'XX')).to.be.undefined;
  });
  it('should parse non-geographic numbering plan phone numbers (extended)', function () {
    var phoneNumber = parsePhoneNumberFromString('+870773111632');
    phoneNumber.number.should.equal('+870773111632');

    if (USE_NON_GEOGRAPHIC_COUNTRY_CODE) {
      phoneNumber.country.should.equal('001');
    } else {
      expect(phoneNumber.country).to.be.undefined;
    }

    phoneNumber.countryCallingCode.should.equal('870');
  });
  it('should parse non-geographic numbering plan phone numbers (default country code) (extended)', function () {
    var phoneNumber = parsePhoneNumberFromString('773111632', {
      defaultCallingCode: '870'
    });
    phoneNumber.number.should.equal('+870773111632');

    if (USE_NON_GEOGRAPHIC_COUNTRY_CODE) {
      phoneNumber.country.should.equal('001');
    } else {
      expect(phoneNumber.country).to.be.undefined;
    }

    phoneNumber.countryCallingCode.should.equal('870');
  });
  it('should determine the possibility of non-geographic phone numbers', function () {
    var phoneNumber = parsePhoneNumberFromString('+870773111632');
    phoneNumber.isPossible().should.equal(true);
    var phoneNumber2 = parsePhoneNumberFromString('+8707731116321');
    phoneNumber2.isPossible().should.equal(false);
  });
});
//# sourceMappingURL=parsePhoneNumberFromString.test.js.map