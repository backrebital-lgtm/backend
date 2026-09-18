import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../common/entities';
import { UserRole } from '../../common/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
 const r={getAllAndOverride:jest.fn()}, repo={findOne:jest.fn()};
 const c=(user?:{userId:string})=>({getHandler:jest.fn(),getClass:jest.fn(),switchToHttp:()=>({getRequest:()=>({user})})}) as never;
 let guard:RolesGuard;
 beforeEach(async()=>{jest.clearAllMocks();guard=await Test.createTestingModule({providers:[RolesGuard,{provide:Reflector,useValue:r},{provide:getRepositoryToken(User),useValue:repo}]}).compile().then(m=>m.get(RolesGuard));});
 it('allows a user with a required role',async()=>{r.getAllAndOverride.mockReturnValue([UserRole.MAINTAINER]);repo.findOne.mockResolvedValue({roles:[UserRole.MAINTAINER]});await expect(guard.canActivate(c({userId:'u'}))).resolves.toBe(true);});
 it('denies a user without a required role',async()=>{r.getAllAndOverride.mockReturnValue([UserRole.SPONSOR]);repo.findOne.mockResolvedValue({roles:[UserRole.CONTRIBUTOR]});await expect(guard.canActivate(c({userId:'u'}))).resolves.toBe(false);});
 it('rejects unauthenticated requests',async()=>{r.getAllAndOverride.mockReturnValue([UserRole.SPONSOR]);await expect(guard.canActivate(c())).rejects.toThrow(UnauthorizedException);});
 it('allows routes without Roles without querying the database',async()=>{r.getAllAndOverride.mockReturnValue(undefined);await expect(guard.canActivate(c())).resolves.toBe(true);expect(repo.findOne).not.toHaveBeenCalled();});
 it('rejects a user deleted after authentication',async()=>{r.getAllAndOverride.mockReturnValue([UserRole.SPONSOR]);repo.findOne.mockResolvedValue(null);await expect(guard.canActivate(c({userId:'gone'}))).rejects.toThrow('Authenticated user no longer exists');});
});
