# RoomTrack Production Checklist

## Security

- [X] SESSION_SECRET configured
- [X] .env excluded from source control
- [ ] HTTPS enabled
- [X] Helmet enabled
- [X] Authentication tested
- [X] Authorization tested

## Database

- [ ] roomtrack.db backed up
- [ ] Restore procedure documented
- [X] Admin account created

## Verification

- [X] npm test passes
- [X] Login verified
- [X] Logout verified
- [X] Staff permissions verified
- [X] Admin permissions verified

## Deployment

- [ ] Production environment variables configured
- [ ] Application starts successfully
- [ ] Health endpoint responds
- [ ] Logs reviewed after startup