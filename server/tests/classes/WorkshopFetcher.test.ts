import axios from 'axios';
import { WorkshopFetcher } from '../../src/classes/WorkshopFetcher';
import { WorkshopParser } from '../../src/classes/WorkshopParser';

jest.mock('axios');
jest.mock('../../src/classes/WorkshopParser');

const mockedAxios = jest.mocked(axios);
const mockedWorkshopParser = jest.mocked(WorkshopParser);

describe(WorkshopFetcher.name, () => {
    describe(WorkshopFetcher.prototype.fetchNumPages.name, () => {
        const data = 'fake data';

        afterAll(() => {
            jest.clearAllMocks();
        });

        beforeAll(async () => {
            mockedAxios.get.mockResolvedValueOnce({ data });
            mockedWorkshopParser.parsePageCount.mockReturnValueOnce(123);

            await new WorkshopFetcher().fetchNumPages();
        });

        it('makes a network request', () => {
            expect(mockedAxios.get).toBeCalledTimes(1);
            expect(mockedAxios.get).toBeCalledWith(
                'https://steamcommunity.com/workshop/browse',
                expect.objectContaining({ params: expect.objectContaining({ p: 1 }) }),
            );
        });

        it('parses the response', () => {
            expect(mockedWorkshopParser.parsePageCount).toBeCalledTimes(1);
            expect(mockedWorkshopParser.parsePageCount).toBeCalledWith(data);
        });
    });

    describe(WorkshopFetcher.fetchMod.name, () => {
        const id = 'fake id';
        const data = 'fake data';

        afterAll(() => {
            jest.clearAllMocks();
        });

        beforeAll(async () => {
            mockedAxios.get.mockResolvedValueOnce({ data });

            await WorkshopFetcher.fetchMod(id);
        });

        it('makes a network request', () => {
            expect(mockedAxios.get).toBeCalledTimes(1);
            expect(mockedAxios.get).toBeCalledWith(
                'https://steamcommunity.com/sharedfiles/filedetails',
                expect.objectContaining({ params: expect.objectContaining({ id }) }),
            );
        });

        it('parses the response', () => {
            expect(mockedWorkshopParser).toBeCalledTimes(1);

            // all non-static WorkshopParser methods should be called
            for (const method of Object.keys(mockedWorkshopParser.prototype)) {
                expect(mockedWorkshopParser.prototype[method as keyof WorkshopParser]).toBeCalledTimes(1);
            }
        });
    });
});
